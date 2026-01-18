import { Tabs } from "expo-router";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { View, Text } from "react-native";
import { icons } from "lucide-react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
    MoreSheetProvider,
    useMoreSheet,
} from "@/components/navigation/MoreSheetContext";
import MoreSheet from "@/components/navigation/MoreSheet";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";

const Icon = ({
    name,
    color,
    size,
}: {
    name: string;
    color: string;
    size: number;
}) => {
    const LucideIcon = icons[name as keyof typeof icons];

    if (!LucideIcon) {
        console.error(`Icon "${name}" not found in lucide-react-native`);
        return null;
    }

    return <LucideIcon color={color} size={size} />;
};
function TabIcon({
    name,
    label,
    color,
    focused,
}: {
    name: string;
    label: string;
    color: string;
    focused: boolean;
}) {
    const scheme = useColorScheme();
    const isDark = (scheme ?? "light") === "dark";
    const fontSize = useAccessibleFontSize();

    return (
        <View className='items-center justify-center' style={{ minWidth: 60 }}>
            <View
                className={`p-2 rounded-2xl ${focused && "bg-boxBackground-dark dark:bg-boxBackground-light"}`}>
                <Icon
                    size={24}
                    name={name}
                    color={focused ? (isDark ? "black" : "white") : "#A1A1A1"}
                />
            </View>
            <Text
                style={{ flexShrink: 0, fontSize: fontSize.xs }}
                className={`mt-1 ${focused ? "text-black dark:text-white" : "text-silverText"}`}>
                {label}
            </Text>
        </View>
    );
}

function MoreButton(props: any) {
    const { open } = useMoreSheet();
    return (
        <HapticTab
            {...props}
            onPress={(e) => {
                e.preventDefault();
                open();
            }}
        />
    );
}

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView className='flex-1' edges={["bottom"]}>
            <MoreSheetProvider>
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarButton: HapticTab,
                        tabBarActiveTintColor: theme.tint,
                        tabBarInactiveTintColor:
                            colorScheme === "dark" ? "#8A8A8A" : "#9CA3AF",
                        tabBarStyle: {
                            height: 68,
                            paddingTop: 18,
                            paddingBottom: insets.bottom + 8,
                            paddingHorizontal: 16,
                            borderTopWidth: 0,
                            backgroundColor:
                                colorScheme === "dark" ? "#0A0A0A" : "#FFFFFF",
                            elevation: 12,
                            shadowColor: "#000",
                            shadowOpacity: 0.06,
                            shadowRadius: 10,
                            shadowOffset: { width: 0, height: -2 },
                        },
                        tabBarLabel: () => null,
                    }}>
                    <Tabs.Screen
                        name='index'
                        options={{
                            title: "Home",
                            tabBarIcon: ({ color, focused }) => (
                                <TabIcon
                                name='House'
                                    label='Home'
                                    color={color}
                                    focused={focused}
                                />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name='band'
                        options={{
                            title: "Band",
                            tabBarIcon: ({ color, focused }) => (
                                <TabIcon
                                    name='Users'
                                    label='Band'
                                    color={color}
                                    focused={focused}
                                />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name='songs'
                        options={{
                            title: "Songs",
                            tabBarIcon: ({ color, focused }) => (
                                <TabIcon
                                name='Music'
                                label='Songs'
                                color={color}
                                focused={focused}
                                />
                            ),
                        }}
                    />
                        <Tabs.Screen
                            name='ideas'
                            options={{
                                title: "Ideas",
                                tabBarIcon: ({ color, focused }) => (
                                    <TabIcon
                                        name='Lightbulb'
                                        label='Ideas'
                                        color={color}
                                        focused={focused}
                                    />
                                ),
                            }}
                        />
                    <Tabs.Screen
                        name='chat'
                        options={{
                            title: "Chat",
                            tabBarIcon: ({ color, focused }) => (
                                <TabIcon
                                name='MessageCircle'
                                label='Chat'
                                color={color}
                                focused={focused}
                                />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name='more'
                        options={{
                            title: "More",
                            tabBarButton: (props) => <MoreButton {...props} />,
                            tabBarIcon: ({ color, focused }) => (
                                <TabIcon
                                    name='Ellipsis'
                                    label='More'
                                    color={color}
                                    focused={focused}
                                />
                            ),
                        }}
                    />
                    {/* Hidden routes - accessible via MoreSheet */}
                    <Tabs.Screen
                        name='_events'
                        options={{
                            href: null,
                        }}
                    />
                    <Tabs.Screen
                        name='_practice'
                        options={{
                            href: null,
                        }}
                    />
                    <Tabs.Screen
                        name='_todos'
                        options={{
                            href: null,
                        }}
                    />
                    <Tabs.Screen
                        name='_profile'
                        options={{
                            href: null,
                        }}
                    />
                </Tabs>
                <MoreSheet />
            </MoreSheetProvider>
        </SafeAreaView>
    );
}
