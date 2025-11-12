import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface PageContainerProps {
    children: React.ReactNode;
    centered?: boolean;
    noBandState?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
    children,
    centered = false,
    noBandState = false,
}) => {
    const systemScheme = useColorScheme();

    return (
        <LinearGradient
            colors={
                systemScheme === "dark"
                    ? ["rgba(172, 70, 255, 0.46)", "#0A0A0A"]
                    : ["rgba(172, 70, 255, 0.46)", "#ffffffff"]
            }
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            className="flex-1 items-center justify-center w-full"
        >
            <SafeAreaView
                edges={["top", "left", "right"]}
                className={`flex-1 w-full items-center ${
                    centered || noBandState
                        ? "justify-center px-4"
                        : "justify-start"
                }`}
            >
                {children}
            </SafeAreaView>
        </LinearGradient>
    );
};

export default PageContainer;
