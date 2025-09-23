import { View, Text, Pressable } from "react-native";

export default function SwitchTabs({
    tabs,
    activeTab,
    setActiveTab,
    className,
}: {
    tabs: string[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    className?: string;
}) {
    return (
        <View
            className={`rounded-m w-full flex-row p-2 bg-accent-light dark:bg-accent-dark my-3 ${className}`}
        >
            {tabs.map((tab, index) => (
                <Pressable
                    key={index}
                    className={`p-3 rounded-m ${activeTab === tab ? "bg-boxBackground-light dark:bg-boxBackground-dark" : "bg-accent-light dark:bg-accent-dark"}`}
                    style={{ flex: 1 }}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text
                        className={`text-base ${activeTab === tab ? "text-black dark:text-white" : "text-silverText"}`}
                    >
                        {tab}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}
