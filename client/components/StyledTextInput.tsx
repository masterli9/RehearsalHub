import { TextInput, TextInputProps } from "react-native";

interface StyledTextInputProps extends TextInputProps {
    variant?: "default" | "rounded";
}

const StyledTextInput: React.FC<StyledTextInputProps> = ({
    variant = "default",
    className,
    placeholderTextColor = "#A1A1A1",
    ...props
}) => {
    const baseClassName =
        "w-full p-3 bg-white dark:bg-darkGray text-black dark:text-white border border-accent-light dark:border-accent-dark";
    const variantClassName = variant === "rounded" ? "rounded-2xl" : "rounded-m";
    const finalClassName = `${baseClassName} ${variantClassName} ${className || ""}`;

    return (
        <TextInput
            className={finalClassName}
            placeholderTextColor={placeholderTextColor}
            {...props}
        />
    );
};

export default StyledTextInput;

