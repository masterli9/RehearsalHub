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

interface Message {
    id: number;
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
    const { user, idToken } = useAuth();

    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight?.() ?? 0;

    // Offset pro iOS, aby se počítal i header (React Navigation)
    const KBO = Platform.OS === "ios" ? headerHeight : 10;

    const [messageInput, setMessageInput] = useState("");
    // Create socket instance only once and reuse it
    const socketRef = useRef<ReturnType<typeof io> | null>(null);
    const socket = useMemo(() => {
        if (!socketRef.current) {
            socketRef.current = io("http://192.168.88.240:3001", {
                auth: {
                    token: idToken ?? "",
                },
                port: 3001,
                transports: ["websocket", "polling"], // Explicitly set transports
            });
        } else {
            // Update auth token if it changed
            socketRef.current.auth = { token: idToken ?? "" };
        }
        return socketRef.current;
    }, [idToken]);
    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io("http://192.168.88.240:3001", {
                auth: {
                    token: idToken ?? "",
                },
                port: 3001,
                transports: ["websocket", "polling"], // Explicitly set transports
            });
        } else {
            // Update auth token if it changed
            socketRef.current.auth = { token: idToken ?? "" };
        }

        const socket = socketRef.current;
        if (!socket.connected) {
            socket.connect();
        }
        const onConnect = () => {
            console.log("Socket connected:", socket.connected);
        };
        socket.on("connect", onConnect);

        const onConnectError = (err: any) => {
            console.error("Socket connect error:", err);
        };
        socket.on("connect_error", onConnectError);

        return () => {
            socket.off("connect", onConnect);
            socket.off("connect_error", onConnectError);
            socket.disconnect();
        };
    }, [idToken]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    const getMessageHistory = async ({
        loadOlder = false,
    }: {
        loadOlder?: boolean;
    }) => {
        const params = new URLSearchParams();
        if (loadOlder && nextCursor) params.set("before", nextCursor);
        params.set("limit", "5");

        const res = await fetch(
            `${apiUrl}/api/messages/${activeBand?.id}${params.toString()}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken ?? ""}`,
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
            setMessages((prev) => [...prev, ...asc]);
        } else {
            setMessages(asc);
        }
        setNextCursor(newCursor ?? null);
    };
    useEffect(() => {
        getMessageHistory({ loadOlder: false });
    }, [activeBand?.id, nextCursor]);
    const handleMessageSend = async ({ text }: { text: string }) => {
        socket.emit("message:send", {
            bandId: activeBand?.id,
            text: text,
            tempId: Date.now(),
        });
        getMessageHistory({ loadOlder: true });
    };
    useEffect(() => {
        // Avoid calling connect if already connected or connecting
        if (!socket.connected) {
            socket.connect();
        }

        getMessageHistory({ loadOlder: false });
    }, []);

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
        return (
            <View
                className={`my-2 w-full flex-col ${position === "right" ? "items-end" : "items-start"} justify-center`}>
                <Text className='text-base text-silverText px-2'>
                    {authorUsername} · {sentAt}
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
                            keyExtractor={(item) => item.id.toString()}
                            className='flex-1 w-full px-2'
                            contentContainerStyle={{
                                flexGrow: 1,
                                justifyContent: "flex-end",
                            }}
                            inverted={false}
                            keyboardShouldPersistTaps='handled'
                            renderItem={({ item }) => (
                                <MessageBubble
                                    text={item.text}
                                    authorUsername={item.author.username}
                                    sentAt={item.sent_at}
                                />
                            )}
                        />
                        <View className='flex-row w-full gap-3 px-2'>
                            <StyledTextInput
                                variant='rounded'
                                className='flex-1 bg-darkWhite dark:bg-accent-dark'
                                placeholder='Message'
                                onChangeText={(text) => setMessageInput(text)}
                                value={messageInput}
                            />
                            <Pressable
                                className={`bg-black dark:bg-white rounded-m p-2 active:bg-accent-dark dark:active:bg-accent-light active:scale-95 justify-center items-center`}
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
