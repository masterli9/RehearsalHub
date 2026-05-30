import { ViewProps } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

interface CardProps extends ViewProps {
    children: React.ReactNode;
    variant?: "default" | "boxBackground";
    animated?: boolean;
}

const Card: React.FC<CardProps> = ({
    children,
    variant = "default",
    className,
    animated = true,
    ...props
}) => {
    const baseClassName =
        variant === "boxBackground"
            ? "bg-boxBackground-light dark:bg-boxBackground-dark"
            : "bg-darkWhite dark:bg-boxBackground-dark";
    const borderClassName =
        "border border-accent-light dark:border-accent-dark rounded-2xl p-5";
    const finalClassName = `${baseClassName} ${borderClassName} ${className || ""}`;

    if (animated) {
        return (
            <Animated.View 
                className={finalClassName} 
                {...props}>
                {children}
            </Animated.View>
        );
    }

    return (
        <Animated.View className={finalClassName} {...props}>
            {children}
        </Animated.View>
    );
};

export default Card;
