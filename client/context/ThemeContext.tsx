// context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

type ThemePreference = "light" | "dark" | "system";

interface ThemeContextType {
    themePreference: ThemePreference;
    setThemePreference: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    themePreference: "system",
    setThemePreference: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    // We use NativeWind's hook to control the actual styling engine
    const { setColorScheme } = useNativeWindColorScheme();
    const [themePreference, setThemeState] =
        useState<ThemePreference>("system");
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const saved = await AsyncStorage.getItem(
                    "user-theme-preference"
                );
                if (
                    saved === "light" ||
                    saved === "dark" ||
                    saved === "system"
                ) {
                    setThemeState(saved);
                    setColorScheme(saved);
                } else {
                    // Default to system if nothing is saved
                    setColorScheme("system");
                }
            } catch (error) {
                console.log("Failed to load theme preference", error);
            } finally {
                setLoaded(true);
            }
        };
        loadTheme();
    }, []);

    const setThemePreference = async (newTheme: ThemePreference) => {
        setThemeState(newTheme);
        setColorScheme(newTheme); // This updates NativeWind classes (dark:bg-black etc)
        try {
            await AsyncStorage.setItem("user-theme-preference", newTheme);
        } catch (error) {
            console.log("Failed to save theme preference", error);
        }
    };

    // Optional: Prevent rendering until theme is loaded to avoid flash of wrong theme
    if (!loaded) return null;

    return (
        <ThemeContext.Provider value={{ themePreference, setThemePreference }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
