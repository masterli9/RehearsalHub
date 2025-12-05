import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { Text } from "react-native";

interface ErrorTextProps {
    children: React.ReactNode;
    className?: string;
}

const ErrorText: React.FC<ErrorTextProps> = ({ children, className }) => {
    return (
        <Text
            className={`text-red-500 mb-2 ${className || ""}`}
            style={{ fontSize: useAccessibleFontSize().sm }}
        >
            {children}
        </Text>
    );
};

export default ErrorText;
