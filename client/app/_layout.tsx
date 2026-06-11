import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import MiniPlayer from "@/components/MiniPlayer";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { View, Text, ActivityIndicator } from "react-native";
import "../global.css";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BandProvider, useBand } from "@/context/BandContext";
import { MenuProvider } from "react-native-popup-menu";
import { PlayerProvider } from "@/context/AudioPlayerContext";
import { ThemeProvider as AppThemeProvider } from "@/context/ThemeContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { KeyboardProvider } from "react-native-keyboard-controller";

export const unstable_settings = {
    anchor: "(tabs)",
};

import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

function AuthGate() {
    const { user, loading } = useAuth();
    const fontSize = useAccessibleFontSize();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/auth');
        } else if (user && inAuthGroup) {
            if (!user.emailVerified) {
                 // optionally redirect to verifyEmail if you have it
            } else {
                 router.replace('/(tabs)');
            }
        }
    }, [user, loading, segments]);

    if (loading) {
        return (
            <View className='flex-1 items-center justify-center bg-black'>
                <ActivityIndicator size='large' color='white' />
            </View>
        );
    }

    if (user && !user.emailVerified) {
        return (
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name='(auth)/auth' />
            </Stack>
        );
    }

    return (
        <View className='flex-1'>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name='(tabs)' />
                <Stack.Screen name='(auth)/auth' />
            </Stack>

            {user && <MiniPlayer />}
        </View>
    );
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <KeyboardProvider>
            <MenuProvider>
                <AuthProvider>
                    <BandProvider>
                        <AppThemeProvider>
                            <ThemeProvider
                                value={
                                    colorScheme === "dark"
                                        ? DarkTheme
                                        : DefaultTheme
                                }>
                                <PlayerProvider>
                                    <AuthGate />
                                    <StatusBar style='auto' />
                                </PlayerProvider>
                            </ThemeProvider>
                        </AppThemeProvider>
                    </BandProvider>
                </AuthProvider>
            </MenuProvider>
        </KeyboardProvider>
    );
}
