import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Slot, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect, useState } from "react";

export const unstable_settings = {
    anchor: "(tabs)",
};

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // TODO: Check if user is authenticated
        setIsAuthenticated(false);
    });

    return isAuthenticated;
};

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const isAuthenticated = useAuth();

    return (
        <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            {isAuthenticated ? (
                <Slot />
            ) : (
                <Stack>
                    <Stack.Screen
                        name='(auth)/auth'
                        options={{ headerShown: false }}
                    />
                </Stack>
            )}
            {/* <Stack>
                <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
                <Stack.Screen
                    name='modal'
                    options={{ presentation: "modal", title: "Modal" }}
                />
            </Stack> */}
            <StatusBar style='auto' />
        </ThemeProvider>
    );
}
