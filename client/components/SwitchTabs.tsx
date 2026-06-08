import { View, Text, Pressable, LayoutChangeEvent } from "react-native";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useEffect, useState } from "react";

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
    const fontSize = useAccessibleFontSize();
    const activeIndex = tabs.indexOf(activeTab);

    // Uchováváme rozměry každého tabu
    const [dimensions, setDimensions] = useState<{x: number, y: number, width: number, height: number}[]>(
        Array(tabs.length).fill({ x: 0, y: 0, width: 0, height: 0 })
    );

    // Sdílené hodnoty pro animaci klouzajícího pozadí
    const translateX = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);
    const indicatorHeight = useSharedValue(0);
    const indicatorY = useSharedValue(0);
    // Na začátku neprůhledné, aby nebylo vidět uskočení při prvním renderu
    const indicatorOpacity = useSharedValue(0);

    useEffect(() => {
        const dim = dimensions[activeIndex];
        if (dim && dim.width > 0) {
            // Posun a šířka se plynule animují bez "přelétnutí" (springu)
            const timingConfig = { duration: 200 };
            translateX.value = withTiming(dim.x, timingConfig);
            indicatorWidth.value = withTiming(dim.width, timingConfig);
            indicatorHeight.value = dim.height;
            indicatorY.value = dim.y;
            indicatorOpacity.value = 1; 
        }
    }, [activeIndex, dimensions]);

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
            width: indicatorWidth.value,
            height: indicatorHeight.value,
            top: indicatorY.value,
            opacity: indicatorOpacity.value,
        };
    });

    const handleLayout = (event: LayoutChangeEvent, index: number) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        setDimensions(prev => {
            const newDims = [...prev];
            newDims[index] = { x, y, width, height };
            return newDims;
        });
    };

    return (
        <View
            className={`rounded-m w-full flex-row p-2 bg-accent-light dark:bg-accent-dark my-3 gap-1 relative ${className}`}>
            
            {/* Jediné klouzající pozadí */}
            <Animated.View
                className="absolute bg-boxBackground-light dark:bg-boxBackground-dark rounded-m"
                style={[
                    {
                        left: 0,
                        boxShadow: "0 0 3px 0 rgba(0, 0, 0, 0.1)",
                    },
                    indicatorStyle,
                ]}
            />

            {tabs.map((tab, index) => {
                const isActive = activeTab === tab;
                return (
                    <Pressable
                        key={index}
                        onLayout={(e) => handleLayout(e, index)}
                        className="p-3 items-center justify-center rounded-m z-10"
                        style={{ flex: 1 }}
                        onPress={() => setActiveTab(tab)}>
                        <Text
                            className={`${isActive ? "text-black dark:text-white" : "text-silverText"}`}
                            style={{ fontSize: fontSize.base }}>
                            {tab}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
