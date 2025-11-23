import { useEffect } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";

export default function OAuthRedirect() {
    const fontSize = useAccessibleFontSize();
    
    useEffect(() => {
        // This component handles the OAuth redirect
        // The actual OAuth handling is done in GoogleSignInButton component
        // We just need to redirect back to the main app after a short delay
        const timer = setTimeout(() => {
            router.replace("/(tabs)");
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View className="flex-1 items-center justify-center bg-black">
            <Text className="text-white" style={{ fontSize: fontSize.lg }}>
                Completing authentication...
            </Text>
        </View>
    );
}
