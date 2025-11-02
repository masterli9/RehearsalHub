import { Text } from "react-native";

interface ErrorTextProps {
    children: React.ReactNode;
    className?: string;
}

const ErrorText: React.FC<ErrorTextProps> = ({ children, className }) => {
    return (
        <Text className={`text-red-500 mb-3 ${className || ""}`}>
            {children}
        </Text>
    );
};

export default ErrorText;

