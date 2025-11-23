import { Pressable, Text } from "react-native";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";

export default function StyledButton({
    title,
    onPress,
    disabled,
}: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
}) {
    const fontSize = useAccessibleFontSize();
    
    return (
        <Pressable
            className={`bg-black dark:bg-white rounded-m p-2 active:bg-accent-dark dark:active:bg-accent-light active:scale-95 ${disabled ? "bg-black/70 dark:bg-white/80" : ""}`}
            onPress={onPress}
            disabled={disabled}>
            <Text className='font-bold text-white dark:text-black' style={{ fontSize: fontSize.base }}>
                {title}
            </Text>
        </Pressable>
    );
}
