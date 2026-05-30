import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Pressable, Text } from "react-native";
import { ActivityIndicator } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

type StyledButtonProps = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    className?: string;
    variant?: "default" | "accent";
    showActivityIndicator?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const variantClassNames: Record<"default" | "accent", string> = {
    default:
        "bg-black dark:bg-white rounded-m p-2 flex-row items-center justify-center active:bg-accent-dark dark:active:bg-accent-light",
    accent: "bg-accent-light dark:bg-accent-dark rounded-m p-2 flex-row items-center justify-center",
};

const variantTextClassNames: Record<"default" | "accent", string> = {
    default: "font-bold text-white dark:text-black",
    accent: "font-bold text-black dark:text-white",
};

export default function StyledButton({
    title,
    onPress,
    disabled,
    className,
    variant = "default",
    showActivityIndicator = false,
}: StyledButtonProps) {
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();

    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.985, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 150 });
    };

    const disabledClass =
        variant === "default"
            ? "bg-black/70 dark:bg-white/80"
            : "bg-accent-light/60 dark:bg-accent-dark/60";

    return (
        <AnimatedPressable
            className={`${variantClassNames[variant]} ${
                disabled ? disabledClass : ""
            } ${className ?? ""}`}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={animatedStyle}>
            <Text
                className={variantTextClassNames[variant]}
                style={{ fontSize: fontSize.base }}>
                {title}
            </Text>
            {showActivityIndicator && (
                <ActivityIndicator
                    size='small'
                    color={colorScheme === "dark" ? "black" : "white"}
                />
            )}
        </AnimatedPressable>
    );
}
