import NoBand from "@/components/NoBand";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StyledTextInput from "@/components/StyledTextInput";
import { SwitchBandModal } from "@/components/SwitchBandModal";
import apiUrl from "@/config";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { auth } from "@/lib/firebase";
import { useHeaderHeight } from "@react-navigation/elements";
import { onIdTokenChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Image as RNImage,

    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";

import { Image as ExpoImage } from "expo-image";
import { MenuOption } from "react-native-popup-menu";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { io } from "socket.io-client";

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
    isEdited?: boolean;
    isDeleted?: boolean;
    type?: "text" | "gif" | "image";
    mediaUrl?: string;
}


const chat = () => {
    const socketUrl = apiUrl.replace(":3000", "");
    const { bands, activeBand } = useBand();
    const { user, idToken, setIdToken } = useAuth();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();

    // Create socket instance only once and reuse it
    const socketRef = useRef<ReturnType<typeof io> | null>(null);
    const flatListRef = useRef<FlatList<Message>>(null);
    const shouldScrollToBottomRef = useRef(false);
    const initialRenderRef = useRef(true);

    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight?.() ?? 0;

    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

    const [messages, setMessages] = useState<Message[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [messageInput, setMessageInput] = useState("");

    const [showSwitchModal, setShowSwitchModal] = useState<boolean>(false);

    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [loadOlderError, setLoadOlderError] = useState(false);
    const [initialLoadError, setInitialLoadError] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [actionMessage, setActionMessage] = useState<Message | null>(null);
    const [showGifPicker, setShowGifPicker] = useState(false);




    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const baseBottomInset = Math.max(insets.bottom, 8);
    const bottomSpacing = keyboardHeight > 0 ? 8 : 0;

    const maxMessageLength = 1200;

    const getMessageHistory = async ({
        loadOlder = false,
    }: {
        loadOlder?: boolean;
    }) => {
        // Create AbortController for timeout
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, 20000); // 20 second timeout

        try {
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
                    signal: abortController.signal, // Add abort signal
                }
            );

            // Clear timeout on successful response
            clearTimeout(timeoutId);

            // Check if response is ok BEFORE parsing JSON
            if (!res.ok) {
                console.error(
                    "Failed to get message history, status:",
                    res.status
                );
                throw new Error("Failed to load messages");
            }

            const data = await res.json();
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
                setLoadOlderError(false); // Clear error on success
            } else {
                setMessages(desc);
                setInitialLoadError(false); // Clear initial load error on success
            }
            setNextCursor(newCursor ?? null);
            setHasMore(Boolean(newCursor));
        } catch (error: any) {
            // Clear timeout if error occurs
            clearTimeout(timeoutId);

            // Check if error was due to abort (timeout)
            if (error.name === "AbortError") {
                console.error("Request timed out after 20 seconds");
                if (loadOlder) {
                    setLoadOlderError(true);
                } else {
                    setInitialLoadError(true);
                }
                throw new Error("Request timeout");
            }

            console.error("Error fetching message history:", error);
            if (loadOlder) {
                console.log("Setting loadOlderError to true");
                setLoadOlderError(true);
            } else {
                console.log("Setting initialLoadError to true");
                setInitialLoadError(true);
            }
            throw error;
        } finally {
            // Always set initialRenderRef to false after first attempt (success or fail)
            initialRenderRef.current = false;
        }
    };

    const maybeLoadOlder = (forceRetry: boolean = false) => {
        // Don't try to load if already loading, no more messages, no cursor
        // OR there's an error (unless forceRetry is true)
        if (isLoadingOlder || !hasMore || !nextCursor) return;
        if (loadOlderError && !forceRetry) return;

        setIsLoadingOlder(true);
        setLoadOlderError(false);

        // Use setTimeout to ensure state update is rendered before fetch starts
        setTimeout(async () => {
            try {
                await getMessageHistory({ loadOlder: true });
            } catch (error) {
                // Error is already set in getMessageHistory
            } finally {
                setIsLoadingOlder(false);
            }
        }, 10);
    };

    const onEndReached = () => {
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
        // Create socket only once
        if (!socketRef.current) {
            socketRef.current = io(`${socketUrl}:3001`, {
                auth: {
                    token: idToken ?? "",
                },
                port: 3001,
                transports: ["websocket", "polling"],
                autoConnect: false,
            });
        }

        const socket = socketRef.current;

        // Update auth token when it changes
        socket.auth = { token: idToken ?? "" };

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

        const onDisconnect = (reason: string) => {
            console.log("Socket disconnected:", reason);
        };

        const onConnectError = async (err: any) => {
            console.error("Socket connect error:", err);
            if (/unauthorized|id-token-expired/i.test(err.message)) {
                const fresh = await auth.currentUser?.getIdToken(true);
                socket.auth = { token: fresh ?? "" };
                socket.connect();
            }
        };

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
                type: msg.type || "text",
                mediaUrl: msg.mediaUrl,
                isEdited: msg.isEdited,
                isDeleted: msg.isDeleted,
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

                shouldScrollToBottomRef.current = true;
                // For inverted list, add new messages at the beginning
                return [{ ...transformedMsg, status: "ok" }, ...prev];
            });
        };

        const onUpdateMessage = (msg: any) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === (msg.message_id || msg.id)
                        ? { ...m, ...msg, id: msg.id || msg.message_id }
                        : m
                )
            );
        };

        const onTypingState = ({ uid: typingUid, username, isTyping }: { uid: string, username: string, isTyping: boolean }) => {
            if (typingUid === user?.uid) return;
            setTypingUsers((prev) => {
                const updated = new Map(prev);
                if (isTyping) {
                    updated.set(typingUid, username);
                } else {
                    updated.delete(typingUid);
                }
                return updated;
            });
        };

        const onCommitContent = (event: any) => {
            const { contentUri, mimeType } = event;
            if (contentUri) {
                const type = mimeType?.includes("gif") ? "gif" : "image";
                handleMessageSend({ text: "", type, mediaUrl: contentUri });
            }
        };



        // Add listeners
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", onConnectError);
        socket.on("message:new", onNewMessage);
        socket.on("message:update", onUpdateMessage);
        socket.on("typing:state", onTypingState);



        socket.on("rate-limited", () => console.log("Rate limited"));

        // Connect if not connected, or reconnect if token changed
        if (!socket.connected) {
            socket.connect();
        } else {
            // If already connected but token changed, reconnect
            socket.disconnect().connect();
        }

        socket.on("typing:state", onTypingState);

        return () => {
            // Only remove listeners, don't disconnect the socket
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error", onConnectError);
            socket.off("message:new", onNewMessage);
            socket.off("message:update", onUpdateMessage);
            socket.off("typing:state", onTypingState);
        };





    }, [idToken, activeBand?.id]);

    // Load message history when active band changes
    useEffect(() => {
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


    // Handle typing emission
    useEffect(() => {
        if (!socketRef.current || !activeBand?.id) return;
        if (messageInput.length > 0) {
            socketRef.current.emit("typing:start", { bandId: activeBand.id });
        } else {
            socketRef.current.emit("typing:stop", { bandId: activeBand.id });
        }

        const timeout = setTimeout(() => {
            if (messageInput.length > 0) {
                socketRef.current?.emit("typing:stop", { bandId: activeBand.id });
            }
        }, 3000);

        return () => clearTimeout(timeout);
    }, [messageInput]);

    const handleMessageSend = async ({ text, type = "text", mediaUrl }: { text: string, type?: "text" | "gif" | "image", mediaUrl?: string }) => {
        if (!socketRef.current || !activeBand?.id) return;
        if (!text.trim() && !mediaUrl) return;

        if (editingMessage) {
            socketRef.current.emit("message:edit", { messageId: editingMessage.id, text }, (res: any) => {
                if (res.ok) {
                    setEditingMessage(null);
                    setMessageInput("");
                } else {
                    console.error("Edit failed", res.error);
                }
            });
            return;
        }

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
                            username: user?.username ?? "You",
                            photourl: null,
                        },
                    },
                    ...prev,
                ] as Message[]
        );

        // Set timeout BEFORE emitting - if no response in 15 seconds, mark as failed
        const timeoutId = setTimeout(() => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.clientId === tempId && msg.status === "pending"
                        ? {
                              ...msg,
                              status: "failed",
                              error: "timeout",
                          }
                        : msg
                )
            );
        }, 15000);

        socketRef.current.emit(
            "message:send",
            {
                bandId: activeBand.id,
                text,
                type,
                mediaUrl,
                tempId,
            },

            (res: any) => {
                // Clear timeout since we got a response
                clearTimeout(timeoutId);

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

    const handleMessageRetry = ({
        text,
        clientId,
    }: {
        text: string;
        clientId: string;
    }) => {
        // Remove the failed message
        setMessages((prev) => prev.filter((msg) => msg.clientId !== clientId));
        // Send the message again
        handleMessageSend({ text });
    };

    const MessageBubble = ({
        text,
        authorUsername,
        sentAt,
        status,
        clientId,
        messageId,
        photourl,
        isEdited,
        isDeleted,
        type,
        mediaUrl,
        onLongPress,
    }: {

        text: string;
        authorUsername: string;
        sentAt: string;
        status: "ok" | "pending" | "failed";
        clientId?: string;
        messageId?: number;
        photourl?: string | null;
        isEdited?: boolean;
        isDeleted?: boolean;
        type?: "text" | "gif" | "image";
        mediaUrl?: string;
        onLongPress?: () => void;
    }) => {

        const position = authorUsername === user?.username ? "right" : "left";
        const messageIndex = messages.findIndex((m) => m.id === messageId || (m.clientId && m.clientId === clientId));
        const currMsg = messages[messageIndex];
        const prevMsg = messages[messageIndex + 1];
        const nextMsg = messages[messageIndex - 1];
        const currDate = currMsg ? new Date(currMsg.sent_at) : null;
        const prevDate = prevMsg ? new Date(prevMsg.sent_at) : null;
        const nextDate = nextMsg ? new Date(nextMsg.sent_at) : null;

        const isSameDayAsPrev =
            currDate && prevDate ? isSameDay(currDate, prevDate) : false;
        const isSameDayAsNext =
            currDate && nextDate ? isSameDay(currDate, nextDate) : false;

        const prevSameUserAndDay =
            prevMsg?.author?.username === authorUsername && isSameDayAsPrev;
        const nextSameUserAndDay =
            nextMsg?.author?.username === authorUsername && isSameDayAsNext;

        const shouldShowUsername = !(
            messageIndex < messages.length - 1 &&
            prevMsg?.author?.username === currMsg?.author?.username &&
            isSameDayAsPrev
        );

        const isMe = authorUsername === user?.username;

        return (
            <View
                className={`${shouldShowUsername ? "mt-2" : "mt-1"} w-full flex-col ${position === "right" ? "items-end" : "items-start"} justify-center`}>

                {shouldShowUsername && (
                    <Text
                        className={`${colorScheme === "dark" ? "text-silverText" : "text-blue"} px-1`}
                        style={{ fontSize: fontSize.xs }}>
                        {authorUsername} · {prettyTime(sentAt)}
                    </Text>
                )}
                <View 
                    className='flex-row items-center gap-1'
                    style={{ alignSelf: position === 'right' ? 'flex-end' : 'flex-start' }}>

                    {position === "left" && shouldShowUsername && (
                        <View style={{
                                width: fontSize.lg * 1.8,
                                height: fontSize.lg * 1.8,
                            }}>
                            {photourl && (
                                <ExpoImage
                                    source={{ uri: photourl }}
                                    className='rounded-full'
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: 9999,
                                    }}
                                />
                            )}
                        </View>
                    )}

                    <Pressable 
                        disabled={position === "left" || isDeleted || status !== "ok"}
                        onLongPress={onLongPress}
                        className={`bg-darkWhite dark:bg-accent-dark ${position === "right" && (isDeleted ? "bg-gray-500" : "bg-violet dark:bg-violet")} p-3 rounded-2xl ${(() => {
                            if (isMe) {
                                if (prevSameUserAndDay && nextSameUserAndDay) return "rounded-tr-none rounded-br-none";
                                if (prevSameUserAndDay && !nextSameUserAndDay) return "rounded-tr-none";
                                if (!prevSameUserAndDay && nextSameUserAndDay) return "rounded-br-none";
                                return "rounded-2xl";
                            } else {
                                if (prevSameUserAndDay && nextSameUserAndDay) return "rounded-tl-none rounded-bl-none";
                                if (prevSameUserAndDay && !nextSameUserAndDay) return "rounded-tl-none";
                                if (!prevSameUserAndDay && nextSameUserAndDay) return "rounded-bl-none";
                                return "rounded-2xl";
                            }
                        })()}`}
                        style={{ maxWidth: "80%" }}>
                        
                        {isDeleted ? (
                            <Text style={{ fontStyle: "italic", color: "#bbb", fontSize: fontSize.sm }}>This message was deleted</Text>
                        ) : type === "gif" && mediaUrl ? (
                            <View>
                                <ExpoImage 
                                    source={{ uri: mediaUrl }}
                                    style={{ width: 200, height: 150, borderRadius: 8 }}
                                    contentFit="cover"
                                />
                                {text ? <Text style={{ color: "#fff", marginTop: 4, fontSize: fontSize.sm }}>{text}</Text> : null}
                            </View>
                        ) : (
                            <View className="flex-col">
                                <Text
                                    style={{
                                        color: colorScheme === "dark" || position === "right" ? "#ffffff" : "#000000",
                                        fontSize: fontSize.sm,
                                    }}>
                                    {text}
                                </Text>
                                {isEdited && !isDeleted && (
                                    <Text style={{ fontSize: 10, alignSelf: "flex-end", opacity: 0.6, color: "#fff" }}>(edited)</Text>
                                )}
                            </View>
                        )}
                    </Pressable>
                </View>


                {status === "pending" && (
                    <View className='flex-row items-center gap-2'>
                        <ActivityIndicator size='small' color='#2B7FFF' />
                        <Text
                            className={`${colorScheme === "dark" ? "text-silverText" : "text-blue"}`}
                            style={{ fontSize: fontSize.xs }}>
                            Sending...
                        </Text>
                    </View>
                )}
                {status === "failed" && (
                    <View className='flex-row items-center gap-2'>
                        <Text
                            className='text-red-500'
                            style={{ fontSize: fontSize.xs }}>
                            Failed to send.
                        </Text>
                        <Pressable
                            onPress={() => {
                                if (clientId) {
                                    handleMessageRetry({ text, clientId });
                                } else {
                                    handleMessageSend({ text });
                                }
                            }}>
                            <Text
                                className='text-red-500 underline'
                                style={{ fontSize: fontSize.xs }}>
                                Try again.
                            </Text>
                        </Pressable>
                    </View>
                )}
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
                    status={item.status || "ok"}
                    clientId={item.clientId}
                    messageId={item.id}
                    photourl={item.author.photourl}
                    isEdited={item.isEdited}
                    isDeleted={item.isDeleted}
                    type={item.type}
                    mediaUrl={item.mediaUrl}
                    onLongPress={() => setActionMessage(item)}
                />


                {showDate && (
                    <Text
                        className='text-silverText text-center my-2'
                        style={{ fontSize: fontSize.sm }}>
                        {formattedDate.format(d)}
                    </Text>
                )}
            </>
        );
    };

    return (
        <PageContainer noBandState={bands.length === 0}>
            <SwitchBandModal
                onClose={() => setShowSwitchModal(false)}
                visible={showSwitchModal}
            />
            {bands.length === 0 ? (
                <NoBand />
            ) : (
                <>
                    <PageHeader
                        title={`${activeBand?.name} Chat`}
                        subtitle="Chat with your bandmates">
                        <MenuOption
                            onSelect={() => {
                                setShowSwitchModal(true);
                            }}
                            text='Switch band'
                            customStyles={{
                                optionText: {
                                    color:
                                        colorScheme === "dark"
                                            ? "#fff"
                                            : "#333",
                                    paddingVertical: 8,
                                    fontSize: fontSize.base,
                                },
                            }}
                        />
                    </PageHeader>
                    <KeyboardAvoidingView
                        className='flex-1 w-full'
                        behavior={Platform.OS === "ios" ? "padding" : "padding"}
                        keyboardVerticalOffset={
                            Platform.OS === "ios" ? headerHeight : 0
                        }>
                        {initialRenderRef.current ? (
                            <View className='flex-1 w-full justify-center items-center'>
                                <ActivityIndicator
                                    size='large'
                                    color='#2B7FFF'
                                />
                                <Text
                                    className='text-silverText mt-4'
                                    style={{ fontSize: fontSize.base }}>
                                    Loading messages...
                                </Text>
                            </View>
                        ) : initialLoadError ? (
                            <View className='flex-1 w-full justify-center items-center px-8'>
                                <Text
                                    className='text-red-500 font-semibold mb-2'
                                    style={{ fontSize: fontSize.lg }}>
                                    Failed to load messages
                                </Text>
                                <Text
                                    className='text-silverText text-center mb-4'
                                    style={{ fontSize: fontSize.base }}>
                                    Check your connection and try again
                                </Text>
                                <Pressable
                                    onPress={() => {
                                        setInitialLoadError(false);
                                        initialRenderRef.current = true;
                                        getMessageHistory({ loadOlder: false });
                                    }}
                                    className='bg-red-500 px-6 py-3 rounded-lg active:opacity-70'>
                                    <Text
                                        className='text-white font-semibold'
                                        style={{ fontSize: fontSize.base }}>
                                        Try Again
                                    </Text>
                                </Pressable>
                            </View>


                        ) : (
                            <>
                                <FlatList

                                data={messages}
                                ListFooterComponent={
                                    isLoadingOlder ? (
                                        <View className='py-4'>
                                            <ActivityIndicator
                                                size='large'
                                                color='#2B7FFF'
                                            />
                                        </View>
                                    ) : loadOlderError ? (
                                        <View className='py-4 items-center'>
                                            <Text
                                                className='text-red-500 mb-2'
                                                style={{
                                                    fontSize: fontSize.sm,
                                                }}>
                                                Failed to load older messages
                                            </Text>
                                            <Pressable
                                                onPress={() =>
                                                    maybeLoadOlder(true)
                                                }
                                                className='bg-red-500 px-4 py-2 rounded-lg active:opacity-70'>
                                                <Text
                                                    className='text-white font-semibold'
                                                    style={{
                                                        fontSize: fontSize.base,
                                                    }}>
                                                    Try Again
                                                </Text>
                                            </Pressable>
                                        </View>
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
                                {typingUsers.size > 0 && (
                                    <View className="px-4 py-1">
                                        <Text className="text-silverText italic" style={{ fontSize: fontSize.xs }}>
                                            {Array.from(typingUsers.values()).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
                                        </Text>
                                    </View>
                                )}

                                {editingMessage && (
                                    <View className="bg-violet/10 px-4 py-2 flex-row justify-between items-center border-t border-violet/20">
                                        <Text className="text-violet font-semibold" style={{ fontSize: fontSize.sm }}>Editing message...</Text>
                                        <Pressable onPress={() => { setEditingMessage(null); setMessageInput(""); }}>
                                            <Text className="text-gray-500" style={{ fontSize: fontSize.sm }}>Cancel</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </>
                        )}

                        <View
                            className='flex-row w-full gap-3 px-2 items-end'
                            style={{
                                paddingBottom:
                                    keyboardHeight > 0 ? bottomSpacing : 8,
                            }}>
                            <StyledTextInput
                                variant='rounded'

                                className='flex-1 bg-darkWhite dark:bg-accent-dark max-h-40'
                                placeholder='Message'
                                onChangeText={(text) => setMessageInput(text)}
                                value={messageInput}
                                keyboardType='default'
                                multiline={true}
                            />
                            <Pressable
                                className={`disabled:bg-black/70 dark:disabled:bg-white/80 bg-black dark:bg-white rounded-m p-3 active:bg-accent-dark dark:active:bg-accent-light active:scale-95 justify-center items-center max-h-20`}
                                disabled={
                                    messageInput.trim() === "" ||
                                    messageInput.length > maxMessageLength
                                        ? true
                                        : false
                                }
                                onPress={() => {
                                    if (messageInput.trim() === "") return;
                                    handleMessageSend({ text: messageInput });
                                    setMessageInput("");
                                }}>
                                <Text
                                    className='font-bold text-white dark:text-black'
                                    style={{ fontSize: fontSize.base }}>
                                    {editingMessage ? "Save" : "Send"}
                                </Text>
                            </Pressable>
                        </View>
                        {messageInput.length > maxMessageLength && (
                            <Text
                                className='text-red-500 text-center'
                                style={{ fontSize: fontSize.sm }}>
                                Message is too long. Maximum length is{" "}
                                {maxMessageLength} characters.
                            </Text>
                        )}
                    </KeyboardAvoidingView>
                </>
            )}

            <Modal
                visible={!!actionMessage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActionMessage(null)}>
                <Pressable 
                    className="flex-1 bg-black/50 justify-center items-center px-6"
                    onPress={() => setActionMessage(null)}>
                    <View className="bg-white dark:bg-darkGray w-full rounded-2xl overflow-hidden shadow-lg">
                        <Pressable 
                            className="p-4 border-b border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-gray-800"
                            onPress={() => {
                                if (actionMessage) {
                                    setEditingMessage(actionMessage);
                                    setMessageInput(actionMessage.text);
                                }
                                setActionMessage(null);
                            }}>
                            <Text className="text-center text-lg text-black dark:text-white">Edit Message</Text>
                        </Pressable>
                        <Pressable 
                            className="p-4 active:bg-gray-100 dark:active:bg-gray-800"
                            onPress={() => {
                                if (actionMessage?.id) {
                                    socketRef.current?.emit("message:delete", { messageId: actionMessage.id }, (res: any) => {
                                        if (!res.ok) console.error("Delete failed", res.error);
                                    });
                                }
                                setActionMessage(null);
                            }}>
                            <Text className="text-center text-lg text-red-500 font-bold">Delete Message</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </PageContainer>
    );
};

export default chat;


