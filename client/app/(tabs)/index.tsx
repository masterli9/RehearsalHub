import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { router } from "expo-router";
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

    useEffect(() => {
        const fetchEvents = async () => {
            if (!activeBand?.id) {
                setUpcomingEvents([]);
                return;
            }
            setLoadingEvents(true);
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

        fetchEvents();
    }, [activeBand?.id]);

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

    const recentActivities = [
        {
            id: 1, user: "Sarah Chen", action: "shared a new guitar riff idea", time: "5 minutes ago",
            icon: "Music", iconBg: "rgba(240, 177, 0, 0.2)", iconColor: "#F0B100",
        },
        {
            id: 2, user: "Mike Rodriguez", action: "scheduled rehearsal for tomorrow", time: "1 hour ago",
            icon: "Calendar", iconBg: "rgba(173, 70, 255, 0.2)", iconColor: "#AD46FF",
        },
        {
            id: 3, user: "Emma Wilson", action: "updated \"Midnight Blues\" lyrics", time: "3 hours ago",
            icon: "Music", iconBg: "rgba(0, 201, 80, 0.2)", iconColor: "#00C950",
        },
        {
            id: 4, user: "David Kim", action: "sent a message in band chat", time: "5 hours ago",
            icon: "MessageCircle", iconBg: "rgba(246, 51, 154, 0.2)", iconColor: "#F6339A",
        },
        {
            id: 5, user: "You", action: "logged 45 minutes of practice", time: "1 day ago",
            icon: "Activity", iconBg: "rgba(43, 128, 255, 0.2)", iconColor: "#2B7FFF",
        },
    ];

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
                        <Pressable>
                            <Text className="font-semibold" style={{ color: textPrimary, fontSize: fontSize.sm }}>
                                View All
                            </Text>
                        </Pressable>
                    </View>

                    <View className="gap-y-3">
                        {recentActivities.map((activity) => (
                            <View
                                key={activity.id}
                                className="p-4 rounded-2xl flex-row items-center"
                                style={{ backgroundColor: surfaceBg }}>
                                <View
                                    className="p-2 rounded-full mr-4 items-center justify-center"
                                    style={{ backgroundColor: activity.iconBg }}>
                                    <Icon name={activity.icon} color={activity.iconColor} size={20} />
                                </View>
                                <View className="flex-1">
                                    <Text
                                        style={{ color: textPrimary, fontSize: fontSize.sm, lineHeight: 20 }}
                                        numberOfLines={2}>
                                        <Text style={{ fontWeight: "700" }}>{activity.user} </Text>
                                        {activity.action}
                                    </Text>
                                    <Text style={{ color: textSecondary, fontSize: fontSize.xs, marginTop: 4 }}>
                                        {activity.time}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </PageContainer>
    );
}
