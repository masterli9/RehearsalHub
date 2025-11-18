import {
    View,
    Text,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    Keyboard,
    ActivityIndicator,
    useColorScheme,
} from "react-native";
import { useBand } from "@/context/BandContext";
import { useAuth } from "@/context/AuthContext";
import NoBand from "@/components/NoBand";
import { useEffect, useState, useRef } from "react";
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
    const socketUrl = "http://192.168.88.240";
    const { bands, activeBand } = useBand();
    const { user, idToken, setIdToken } = useAuth();

    // Create socket instance only once and reuse it
    const socketRef = useRef<ReturnType<typeof io> | null>(null);
    const flatListRef = useRef<FlatList<Message>>(null);
    const shouldScrollToBottomRef = useRef(false);

    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight?.() ?? 0;

    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

    const [messages, setMessages] = useState<Message[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [messageInput, setMessageInput] = useState("");

    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const baseBottomInset = Math.max(insets.bottom, 8);
    const bottomSpacing = keyboardHeight > 0 ? 8 : 0;

    const getMessageHistory = async ({
        loadOlder = false,
    }: {
        loadOlder?: boolean;
    }) => {
        const params = new URLSearchParams();
        if (loadOlder && nextCursor) params.set("before", nextCursor);
        params.set("limit", "40");
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

        // For inverted list: newest messages at index 0, so keep DESC order (don't reverse)
        const desc = items; // items come from API in DESC order (newest first)
        if (loadOlder) {
            // Deduplicate messages by ID to prevent duplicate keys
            setMessages((prev) => {
                const existingIds = new Set(prev.map((msg) => msg.id));
                const newMessages = desc.filter(
                    (msg: Message) => !existingIds.has(msg.id)
                );
                // Add older messages at the end (they'll appear at top when inverted)
                return [...prev, ...newMessages];
            });
        } else {
            setMessages(desc);
        }
        setNextCursor(newCursor ?? null);
        setHasMore(Boolean(newCursor));
    };

    const maybeLoadOlder = async () => {
        if (isLoadingOlder || !hasMore || !nextCursor) return;
        setIsLoadingOlder(true);
        await getMessageHistory({ loadOlder: true });
        setIsLoadingOlder(false);
    };

    const onEndReached = () => {
        // With inverted list, onEndReached triggers when scrolling to top (older messages)
        maybeLoadOlder();
    };

    const onScrollToIndexFailed = (info: {
        index: number;
        highestMeasuredFrameIndex: number;
        averageItemLength: number;
    }) => {
        // Fallback: scroll to offset if index fails (e.g., item not rendered yet)
        if (info.index === 0) {
            // For inverted list, offset 0 is the bottom
            requestAnimationFrame(() => {
                flatListRef.current?.scrollToOffset({
                    offset: 0,
                    animated: true,
                });
            });
        }
    };

    // Track keyboard height for both iOS and Android
    useEffect(() => {
        if (Platform.OS === "ios") {
            const sub = Keyboard.addListener("keyboardWillChangeFrame", (e) => {
                const h = Math.max(0, e.endCoordinates.height - insets.bottom);
                setKeyboardHeight(h);
            });
            return () => sub.remove();
        } else {
            // Android keyboard listeners
            const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            });
            const hideSub = Keyboard.addListener("keyboardDidHide", () => {
                setKeyboardHeight(0);
            });
            return () => {
                showSub.remove();
                hideSub.remove();
            };
        }
    }, [insets.bottom]);

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
            socketRef.current = io(`${socketUrl}:3001`, {
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

        socket.on("rate-limited", () => console.log("Rate limited"));

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
                    return copy;
                }

                // For inverted list, add new messages at the beginning
                return [{ ...transformedMsg, status: "ok" }, ...prev];
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

    useEffect(() => {
        if (socketRef.current?.connected && activeBand?.id) {
            socketRef.current.emit(
                "band:select",
                { bandId: activeBand.id },
                () => {}
            );
        }

        if (activeBand?.id) {
            getMessageHistory({ loadOlder: false });
        }
    }, [activeBand?.id]);

    // Scroll to bottom when shouldScrollToBottomRef is true and messages update
    useEffect(() => {
        if (shouldScrollToBottomRef.current && messages.length > 0) {
            requestAnimationFrame(() => {
                flatListRef.current?.scrollToIndex({
                    index: 0,
                    animated: true,
                });
            });
            shouldScrollToBottomRef.current = false;
        }
    }, [messages]);

    const handleMessageSend = async ({ text }: { text: string }) => {
        if (!socketRef.current || !activeBand?.id) return;

        const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        // For inverted list, add pending message at the beginning
        shouldScrollToBottomRef.current = true;
        setMessages(
            (prev) =>
                [
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
                    ...prev,
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
    };
    const formattedTime = new Intl.DateTimeFormat(undefined, {
        timeZone: userTZ,
        hour: "2-digit",
        minute: "2-digit",
    });
    const formattedDate = new Intl.DateTimeFormat(undefined, {
        timeZone: userTZ,
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const isSameDay = (date1: Date, date2: Date) => {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    };
    const prettyTime = (iso: string) => {
        const d = new Date(iso);
        const diff = Date.now() - d.getTime();
        if (diff < 10_000) return "just now";
        return formattedTime.format(d);
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
        const colorScheme = useColorScheme();

        return (
            <View
                className={`my-2 w-full flex-col ${position === "right" ? "items-end" : "items-start"} justify-center`}>
                <Text className='text-base text-silverText px-2'>
                    {authorUsername} · {prettyTime(sentAt)}
                </Text>
                <View
                    className='bg-darkWhite dark:bg-accent-dark p-3 rounded-2xl'
                    style={{ maxWidth: "80%" }}>
                    <Text
                        style={{
                            color:
                                colorScheme === "dark" ? "#ffffff" : "#000000",
                            fontSize: 16,
                            // width: "100%",
                        }}>
                        {text}
                    </Text>
                </View>
            </View>
        );
    };
    const renderItem = ({ item, index }: { item: Message; index: number }) => {
        const d = new Date(item.sent_at);
        // For inverted list: index 0 is newest, so "next" is index + 1
        const next = messages[index + 1];
        const showDate = !next || !isSameDay(d, new Date(next.sent_at));

        return (
            <>
                <MessageBubble
                    key={item.id ?? item.clientId ?? index}
                    text={item.text}
                    authorUsername={item.author.username}
                    sentAt={item.sent_at}
                />
                {showDate && (
                    <Text className='text-silverText text-center text-sm my-2'>
                        {formattedDate.format(d)}
                    </Text>
                )}
            </>
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
                        behavior={Platform.OS === "ios" ? "padding" : "padding"}
                        keyboardVerticalOffset={
                            Platform.OS === "ios" ? headerHeight : 0
                        }>
                        <FlatList
                            data={messages}
                            ListFooterComponent={
                                isLoadingOlder ? (
                                    <ActivityIndicator
                                        size='large'
                                        color='#2B7FFF'
                                    />
                                ) : null
                            }
                            keyExtractor={(item) =>
                                (
                                    item.id ??
                                    item.clientId ??
                                    "unknown"
                                ).toString()
                            }
                            className='flex-1 w-full px-2'
                            contentContainerStyle={{
                                paddingTop: 8,
                            }}
                            inverted={true}
                            keyboardShouldPersistTaps='handled'
                            ref={flatListRef}
                            renderItem={renderItem}
                            onEndReached={onEndReached}
                            onEndReachedThreshold={0.5}
                            onScrollToIndexFailed={onScrollToIndexFailed}
                            maintainVisibleContentPosition={{
                                minIndexForVisible: 0,
                            }}
                        />
                        <View
                            className='flex-row w-full gap-3 px-2 items-end'
                            style={{
                                paddingBottom:
                                    keyboardHeight > 0 ? bottomSpacing : 8,
                            }}>
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
