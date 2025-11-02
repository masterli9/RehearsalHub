import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
    children: React.ReactNode;
    variant?: "default" | "boxBackground";
}

const Card: React.FC<CardProps> = ({
    children,
    variant = "default",
    className,
    ...props
}) => {
    const baseClassName =
        variant === "boxBackground"
            ? "bg-boxBackground-light dark:bg-boxBackground-dark"
            : "bg-darkWhite dark:bg-boxBackground-dark";
    const borderClassName =
        "border border-accent-light dark:border-accent-dark rounded-2xl p-5";
    const finalClassName = `${baseClassName} ${borderClassName} ${className || ""}`;

    return (
        <View className={finalClassName} {...props}>
            {children}
        </View>
    );
};

export default Card;

