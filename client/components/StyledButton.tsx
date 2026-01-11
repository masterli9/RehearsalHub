import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Pressable, Text } from "react-native";
import { ActivityIndicator } from "react-native";

type StyledButtonProps = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    className?: string;
    variant?: "default" | "accent";
    showActivityIndicator?: boolean;
};

const variantClassNames: Record<"default" | "accent", string> = {
    default:
        "bg-black dark:bg-white rounded-m p-2 flex-row items-center justify-center active:bg-accent-dark dark:active:bg-accent-light active:scale-95",
    accent: "bg-accent-light dark:bg-accent-dark rounded-m p-2 flex-row items-center justify-center active:scale-95",
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

    const disabledClass =
        variant === "default"
            ? "bg-black/70 dark:bg-white/80"
            : "bg-accent-light/60 dark:bg-accent-dark/60";

    return (
        <Pressable
            className={`${variantClassNames[variant]} ${
                disabled ? disabledClass : ""
            } ${className ?? ""}`}
            onPress={onPress}
            disabled={disabled}>
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
        </Pressable>
    );
}
