import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { View, Text } from "react-native";
import "../global.css";
import { AuthProvider, useAuth } from "@/context/AuthContext";

export const unstable_settings = {
    anchor: "(tabs)",
};

function AuthGate() {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <View className='flex-1 items-center justify-center bg-black'>
                <Text className='text-white text-lg'>
                    Loading (waiting for firebase)...
                </Text>
            </View>
        );
    }

    if (user && !user.emailVerified) {
        return (
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name='(auth)/verifyEmail' />
            </Stack>
        );
    }

    return user ? (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name='(tabs)' />
        </Stack>
    ) : (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name='(auth)/auth' />
        </Stack>
    );
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <AuthProvider>
            <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                <AuthGate />
                <StatusBar style='auto' />
            </ThemeProvider>
        </AuthProvider>
    );
}
