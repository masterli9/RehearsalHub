import {
    View,
    Text,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    FlatList,
} from "react-native";
import { useBand } from "@/context/BandContext";
import { useAuth } from "@/context/AuthContext";
import NoBand from "@/components/NoBand";
import { useEffect, useState, useMemo, useRef } from "react";
import PageContainer from "@/components/PageContainer";
import StyledTextInput from "@/components/StyledTextInput";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import apiUrl from "@/config";
import { io } from "socket.io-client";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface Message {
    id?: number;
    clientId?: string;
    status?: "pending" | "ok" | "failed";
    error?: string;
    text: string;
    sent_at: string;
    bandId: number;
    author: {
        bandMemberId: number;
        username: string;
        photourl: string | null;
    };
}

const chat = () => {
    const { bands, activeBand } = useBand();
    const { user, idToken, setIdToken } = useAuth();

    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight?.() ?? 0;

    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
    // Offset pro iOS, aby se počítal i header (React Navigation)
    const KBO = Platform.OS === "ios" ? headerHeight : 10;

    const [messages, setMessages] = useState<Message[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState("");
    // Create socket instance only once and reuse it
    const socketRef = useRef<ReturnType<typeof io> | null>(null);
    const flatListRef = useRef<FlatList<Message>>(null);

    // Handle token changes from Firebase
    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            const newToken = user ? await user.getIdToken() : null;
            setIdToken(newToken);

            if (socketRef.current) {
                socketRef.current.auth = { token: newToken ?? "" };
                if (socketRef.current.connected) {
                    socketRef.current.disconnect();
                    socketRef.current.connect();
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // Create and manage socket connection
    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io("http://192.168.88.240:3001", {
                auth: {
                    token: idToken ?? "",
                },
                port: 3001,
                transports: ["websocket", "polling"],
                autoConnect: false, // Don't auto-connect, we'll connect manually
            });
        } else {
            // Update auth token if it changed
            socketRef.current.auth = { token: idToken ?? "" };
        }

        const socket = socketRef.current;

        // Only connect if not already connected
        if (!socket.connected) {
            socket.connect();
        }
        const onConnect = () => {
            console.log("Socket connected:", socket.connected);
            if (activeBand?.id) {
                socket.emit(
                    "band:select",
                    { bandId: activeBand.id },
                    (ack: any) => {
                        if (!ack?.ok)
                            console.warn("band:select failed", ack?.error);
                    }
                );
            }
        };
        socket.on("connect", onConnect);

        const onConnectError = async (err: any) => {
            console.error("Socket connect error:", err);
            if (/unauthorized|id-token-expired/i.test(err.message)) {
                const fresh = await auth.currentUser?.getIdToken(true);
                socket.auth = { token: fresh ?? "" };
                socket.connect();
                console.log("Socket reconnected:", socket.connected);
            }
        };
        socket.on("connect_error", onConnectError);

        // Listen for new messages in real-time
        const onNewMessage = (msg: any) => {
            // Transform server message format to match client Message interface
            // Server sends: { message_id, text, sent_at, bandId, author: { bandMemberId } }
            // Client expects: { id, text, sent_at, bandId, author: { bandMemberId, username, photourl } }
            const transformedMsg: Message = {
                id: msg.message_id || msg.id,
                text: msg.text,
                sent_at: msg.sent_at,
                bandId: msg.bandId,
                author: {
                    bandMemberId:
                        msg.author?.bandMemberId || msg.author?.band_member_id,
                    username: msg.author?.username || "Unknown",
                    photourl: msg.author?.photourl || null,
                },
                status: "ok",
            };
            setMessages((prev) => {
                // Check if message already exists to prevent duplicates
                const exists = prev.some((m) => m.id === transformedMsg.id);
                if (exists) return prev;

                const i = prev.findIndex(
                    (m) =>
                        !m.id &&
                        m.status === "pending" &&
                        m.bandId === transformedMsg.bandId &&
                        m.text === transformedMsg.text
                );
                if (i !== -1) {
                    // Replace the optimistic "pending" message with the actual one from the server (confirmed)
                    const copy = [...prev];
                    copy[i] = { ...copy[i], ...transformedMsg, status: "ok" };
                    delete copy[i].clientId;
                    flatListRef.current?.scrollToEnd({ animated: true });
                    return copy;
                }

                flatListRef.current?.scrollToEnd({ animated: true });
                return [...prev, { ...transformedMsg, status: "ok" }];
            });
        };
        socket.on("message:new", onNewMessage);

        return () => {
            socket.off("connect", onConnect);
            socket.off("connect_error", onConnectError);
            socket.off("message:new", onNewMessage);
            socket.disconnect();
        };
    }, [idToken]);

    const getMessageHistory = async ({
        loadOlder = false,
    }: {
        loadOlder?: boolean;
    }) => {
        const params = new URLSearchParams();
        if (loadOlder && nextCursor) params.set("before", nextCursor);
        params.set("limit", "10");
        const freshToken = await auth.currentUser?.getIdToken();

        const res = await fetch(
            `${apiUrl}/api/messages/${activeBand?.id}?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${freshToken ?? ""}`,
                },
                method: "GET",
            }
        );
        const data = await res.json();
        if (!res.ok) {
            console.error("Failed to get message history:", data);
            return;
        }
        const { items, nextCursor: newCursor } = data;

        const asc = [...items].reverse();
        if (loadOlder) {
            // Deduplicate messages by ID to prevent duplicate keys
            setMessages((prev) => {
                const existingIds = new Set(prev.map((msg) => msg.id));
                const newMessages = asc.filter(
                    (msg) => !existingIds.has(msg.id)
                );
                flatListRef.current?.scrollToEnd({ animated: true });
                return [...newMessages, ...prev];
            });
        } else {
            setMessages(asc);
            flatListRef.current?.scrollToEnd({ animated: true });
        }
        setNextCursor(newCursor ?? null);
    };
    useEffect(() => {
        if (socketRef.current?.connected && activeBand?.id) {
            socketRef.current.emit(
                "band:select",
                { bandId: activeBand.id },
                () => {}
            );
        }

        getMessageHistory({ loadOlder: false });
    }, [activeBand?.id]);
    const handleMessageSend = async ({ text }: { text: string }) => {
        if (!socketRef.current || !activeBand?.id) return;

        const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        // 1) optimistická bublina (pending = true) – můžeš si rozšířit typ
        setMessages(
            (prev) =>
                [
                    ...prev,
                    {
                        clientId: tempId,
                        id: undefined,
                        status: "pending",
                        text,
                        sent_at: new Date().toISOString(),
                        bandId: activeBand.id,
                        author: {
                            bandMemberId: -1,
                            username: user?.displayName ?? "You",
                            photourl: null,
                        },
                    },
                ] as Message[]
        );

        socketRef.current.emit(
            "message:send",
            {
                bandId: activeBand.id,
                text,
                tempId,
            },
            (res: any) => {
                if (res?.ok) {
                    setMessages((prev) => {
                        // už máme zprávu s tímto id? -> message:new přišla dřív
                        const already = prev.some(
                            (m) => m.id === res.message.id
                        );
                        if (already) {
                            // jen odstraň pending s tímto clientId
                            return prev.filter(
                                (m) => m.clientId !== res.tempId
                            );
                        }
                        // jinak standardně nahrad pending za reálnou
                        return prev.map((m) =>
                            m.clientId === res.tempId
                                ? { ...m, ...res.message, status: "ok" }
                                : m
                        );
                    });
                } else {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.clientId === res?.tempId
                                ? {
                                      ...msg,
                                      status: "failed",
                                      error: res?.error ?? "unknown-error",
                                  }
                                : msg
                        )
                    );
                }
            }
        );
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    const MessageBubble = ({
        text,
        authorUsername,
        sentAt,
    }: {
        text: string;
        authorUsername: string;
        sentAt: string;
    }) => {
        const position =
            authorUsername === user?.displayName ? "right" : "left";

        const formattedDate = new Intl.DateTimeFormat(undefined, {
            timeZone: userTZ,
            timeStyle: "short",
        }).format(new Date(sentAt));
        return (
            <View
                className={`my-2 w-full flex-col ${position === "right" ? "items-end" : "items-start"} justify-center`}>
                <Text className='text-base text-silverText px-2'>
                    {authorUsername} · {formattedDate}
                </Text>
                <View className='bg-darkWhite dark:bg-accent-dark p-3 rounded-2xl max-w-[66.67%]'>
                    <Text className='text-black dark:text-white text-base text-wrap'>
                        {text}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <PageContainer noBandState={bands.length === 0}>
            {bands.length === 0 ? (
                <NoBand />
            ) : (
                <>
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark my-4 w-full px-5 py-2'>
                        <View className='flex-col items-start justify-center'>
                            <Text className='text-black dark:text-white text-2xl font-bold my-1'>
                                {activeBand?.name} Chat
                            </Text>
                            <Text className='text-silverText'>
                                Chat with your bandmates
                            </Text>
                        </View>
                    </View>
                    <KeyboardAvoidingView
                        className='flex-1 w-full'
                        behavior='padding'
                        keyboardVerticalOffset={KBO}>
                        <FlatList
                            data={messages}
                            keyExtractor={(item) =>
                                (
                                    item.id ??
                                    item.clientId ??
                                    "unknown"
                                ).toString()
                            }
                            className='flex-1 w-full px-2'
                            contentContainerStyle={{
                                flexGrow: 1,
                                justifyContent: "flex-end",
                            }}
                            inverted={false}
                            keyboardShouldPersistTaps='handled'
                            ref={flatListRef}
                            renderItem={({ item }) => (
                                <MessageBubble
                                    text={item.text}
                                    authorUsername={item.author.username}
                                    sentAt={item.sent_at}
                                />
                            )}
                        />
                        <View className='flex-row w-full gap-3 px-2 items-end'>
                            <StyledTextInput
                                variant='rounded'
                                className='flex-1 bg-darkWhite dark:bg-accent-dark max-h-50'
                                placeholder='Message'
                                onChangeText={(text) => setMessageInput(text)}
                                value={messageInput}
                                keyboardType='default'
                                multiline={true}
                            />
                            <Pressable
                                className={`bg-black dark:bg-white rounded-m p-3 active:bg-accent-dark dark:active:bg-accent-light active:scale-95 justify-center items-center max-h-20`}
                                onPress={() => {
                                    if (messageInput.trim() === "") return;
                                    handleMessageSend({ text: messageInput });
                                    setMessageInput("");
                                }}>
                                <Text className='text-base font-bold text-white dark:text-black'>
                                    Send
                                </Text>
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </>
            )}
        </PageContainer>
    );
};

export default chat;
