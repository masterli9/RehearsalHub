import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { router, useFocusEffect } from "expo-router";
import { icons } from "lucide-react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import apiUrl from "@/config";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";

// Helper for Lucide icons
const Icon = ({ name, color, size = 24 }: { name: string; color: string; size?: number }) => {
    const LucideIcon = icons[name as keyof typeof icons];
    if (!LucideIcon) return null;
    return <LucideIcon color={color} size={size} />;
};

export default function HomeScreen() {
    const { user } = useAuth();
    const { activeBand } = useBand();
    const fontSize = useAccessibleFontSize();
    const isDark = useColorScheme() === "dark";

    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);

    const initialFetchDoneRef = useRef<string | null>(null);

    useFocusEffect(
        useCallback(() => {
        const isFirstFetchForBand = initialFetchDoneRef.current !== activeBand?.id;
        const fetchEvents = async () => {
            if (!activeBand?.id) {
                setUpcomingEvents([]);
                return;
            }
            if (isFirstFetchForBand) setLoadingEvents(true);
            try {
                const response = await fetch(`${apiUrl}/api/events?bandId=${activeBand.id}`);
                if (response.ok) {
                    const data = await response.json();
                    const nextEvents = data
                        .filter((event: any) => new Date(event.date_time) >= new Date())
                        .slice(0, 3); // Get 3 closest upcoming events
                    setUpcomingEvents(nextEvents);
                }
            } catch (error) {
                console.error("Error fetching dashboard events:", error);
            } finally {
                setLoadingEvents(false);
            }
        };

        const fetchActivities = async () => {
            if (!activeBand?.id) {
                setRecentActivities([]);
                return;
            }
            if (isFirstFetchForBand) setLoadingActivities(true);
            try {
                const response = await fetch(`${apiUrl}/api/activities?bandId=${activeBand.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setRecentActivities(data.slice(0, 5)); // Get latest 5
                }
            } catch (error) {
                console.error("Error fetching dashboard activities:", error);
            } finally {
                setLoadingActivities(false);
            }
        };

        fetchEvents();
        fetchActivities().finally(() => {
            initialFetchDoneRef.current = activeBand?.id || null;
        });
    }, [activeBand?.id])
    );

    const formatDateTimeToDisplay = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dateStr = "";
        if (diffDays === 0) dateStr = "Today";
        else if (diffDays === 1) dateStr = "Tomorrow";
        else if (diffDays > 1 && diffDays <= 7) dateStr = `In ${diffDays} days`;
        else {
            dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }

        const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        return `${dateStr} at ${timeStr}`;
    };

    const getEventTypeColor = (type: string) => {
        if (type === "rehearsal") return "#00C950";
        if (type === "concert") return "#2B7FFF";
        if (type === "recording") return "#AD46FF";
        return "#A1A1A1";
    };

    const quickActions = [
        { id: "band", label: "Band", icon: "Users", color: "#2B7FFF", route: "/(tabs)/band" },
        { id: "ideas", label: "New Idea", icon: "Lightbulb", color: "#F0B100", route: "/(tabs)/ideas" },
        { id: "songs", label: "Songs", icon: "Music", color: "#00C950", route: "/(tabs)/songs" },
        { id: "events", label: "Events", icon: "Calendar", color: "#AD46FF", route: "/(tabs)/_events" },
        { id: "chat", label: "Chat", icon: "MessageCircle", color: "#F6339A", route: "/(tabs)/chat" },
        { id: "tasks", label: "Tasks", icon: "ListTodo", color: "#FF6900", route: "/(tabs)/_todos" },
    ];

    // Removed hardcoded recentActivities

    const getActivityIconProps = (type: string) => {
        switch (type) {
            case "idea_shared":
                return { icon: "Lightbulb", bg: "rgba(240, 177, 0, 0.2)", color: "#F0B100" };
            case "event_scheduled":
                return { icon: "Calendar", bg: "rgba(173, 70, 255, 0.2)", color: "#AD46FF" };
            case "song_created":
            case "song_updated":
                return { icon: "Music", bg: "rgba(0, 201, 80, 0.2)", color: "#00C950" };
            case "chat_message":
                return { icon: "MessageCircle", bg: "rgba(246, 51, 154, 0.2)", color: "#F6339A" };
            case "task_created":
                return { icon: "ListTodo", bg: "rgba(255, 105, 0, 0.2)", color: "#FF6900" };
            case "task_completed":
                return { icon: "SquareCheckBig", bg: "rgba(255, 105, 0, 0.2)", color: "#FF6900" };
            default:
                return { icon: "Activity", bg: "rgba(43, 128, 255, 0.2)", color: "#2B7FFF" };
        }
    };

    const formatActivityTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minutes ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return "1 day ago";
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString();
    };

    // Theme colors identical to Nativewind setup
    const screenBg = isDark ? "#1E1728" : "#F8F8F8";
    const surfaceBg = isDark ? "#0D0A11" : "#FFFFFF";
    const cardBg = isDark ? "#2C203B" : "#FFFFFF";
    const textPrimary = isDark ? "#FFFFFF" : "#000000";
    const textSecondary = isDark ? "#A1A1A1" : "#666666";

    return (
        <PageContainer noBandState={!activeBand}>
            <PageHeader
                title={`Welcome back, ${user?.username || user?.email?.split('@')[0] || "Musician"}!`}
                subtitle={activeBand ? `Here's what's happening with ${activeBand.name}.` : "Ready to make music? Join or create a band to get started."}
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }} className="w-full">
                {/* Quick Actions Array */}
                <View className="px-5 mb-8">
                    <Text className="font-bold mb-4" style={{ color: textPrimary, fontSize: fontSize.lg }}>
                        Quick Actions
                    </Text>
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        {quickActions.map((action) => (
                            <Pressable
                                key={action.id}
                                onPress={() => router.push(action.route as any)}
                                className="items-center justify-center rounded-2xl active:opacity-75 pt-5 pb-6"
                                style={{
                                    width: "30%",
                                    backgroundColor: surfaceBg,
                                }}>
                                <View
                                    className="p-3 mb-2 rounded-[16px] items-center justify-center"
                                    style={{ backgroundColor: action.color }}>
                                    <Icon name={action.icon} color="#FFFFFF" size={24} />
                                </View>
                                <Text
                                    className="font-medium mt-1 text-center"
                                    style={{ color: textPrimary, fontSize: fontSize.sm }}>
                                    {action.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Upcoming Events */}
                <View className="px-5 mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="font-bold" style={{ color: textPrimary, fontSize: fontSize.lg }}>
                            Upcoming Events
                        </Text>
                        <Pressable onPress={() => router.push("/(tabs)/_events")}>
                            <Text className="font-semibold" style={{ color: textPrimary, fontSize: fontSize.sm }}>
                                View All
                            </Text>
                        </Pressable>
                    </View>

                    {loadingEvents ? (
                        <ActivityIndicator size="small" color={textPrimary} style={{ marginVertical: 20 }} />
                    ) : upcomingEvents.length === 0 ? (
                        <View className="p-4 rounded-2xl flex-col items-center justify-center"
                            style={{ backgroundColor: cardBg, borderWidth: isDark ? 1 : 0, borderColor: "rgba(255,255,255,0.05)" }}>
                            <Text style={{ color: textSecondary, fontSize: fontSize.base }}>
                                No upcoming events planned.
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-y-3">
                            {upcomingEvents.map((event) => {
                                const typeColor = getEventTypeColor(event.type);
                                return (
                                    <Pressable
                                        key={event.event_id}
                                        onPress={() => router.push("/(tabs)/_events")}
                                        className="p-4 rounded-2xl flex-col active:opacity-75"
                                        style={{ backgroundColor: cardBg, borderWidth: isDark ? 1 : 0, borderColor: "rgba(255,255,255,0.05)" }}>
                                        <View className="flex-row justify-between items-start mb-2">
                                            <Text className="font-bold flex-1 mr-2" style={{ color: typeColor, fontSize: fontSize.base }}>
                                                {event.title}
                                            </Text>
                                            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                                                <Text style={{ color: textPrimary, fontSize: fontSize.xs, fontWeight: "600", textTransform: "capitalize" }}>
                                                    {event.type}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="flex-row items-center mt-2">
                                            <Icon name="Clock" color={textSecondary} size={14} />
                                            <Text style={{ color: textSecondary, fontSize: fontSize.sm, marginLeft: 6 }}>
                                                {formatDateTimeToDisplay(event.date_time)}
                                            </Text>
                                        </View>
                                        {event.place ? (
                                            <View className="flex-row items-center mt-2">
                                                <Icon name="MapPin" color={textSecondary} size={14} />
                                                <Text style={{ color: textSecondary, fontSize: fontSize.sm, marginLeft: 6 }}>
                                                    {event.place}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Recent Activity */}
                <View className="px-5 mb-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="font-bold" style={{ color: textPrimary, fontSize: fontSize.lg }}>
                            Recent Activity
                        </Text>
                    </View>

                    {loadingActivities ? (
                        <ActivityIndicator size="small" color={textPrimary} style={{ marginVertical: 20 }} />
                    ) : recentActivities.length === 0 ? (
                        <View className="p-4 rounded-2xl flex-col items-center justify-center"
                            style={{ backgroundColor: cardBg, borderWidth: isDark ? 1 : 0, borderColor: "rgba(255,255,255,0.05)" }}>
                            <Text style={{ color: textSecondary, fontSize: fontSize.base }}>
                                No recent activity yet.
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-y-3">
                            {recentActivities.map((activity) => {
                                const { icon, bg, color } = getActivityIconProps(activity.action_type);
                                const isCurrentUser = activity.firebase_uid === user?.uid;
                                const displayName = isCurrentUser ? "You" : activity.username;

                                return (
                                    <View
                                        key={activity.activity_id}
                                        className="p-4 rounded-2xl flex-row items-center"
                                        style={{ backgroundColor: surfaceBg }}>
                                        <View
                                            className="p-2 rounded-full mr-4 items-center justify-center"
                                            style={{ backgroundColor: bg }}>
                                            <Icon name={icon} color={color} size={20} />
                                        </View>
                                        <View className="flex-1">
                                            <Text
                                                style={{ color: textPrimary, fontSize: fontSize.sm, lineHeight: 20 }}
                                                numberOfLines={2}>
                                                <Text style={{ fontWeight: "700" }}>{displayName} </Text>
                                                {activity.action_text}
                                            </Text>
                                            <Text style={{ color: textSecondary, fontSize: fontSize.xs, marginTop: 4 }}>
                                                {formatActivityTime(activity.created_at)}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </PageContainer>
    );
}
