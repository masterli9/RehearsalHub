// hooks/use-color-scheme.ts
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

/**
 * Returns 'light' or 'dark'.
 * Even if the user setting is 'system', this returns the actual resolved color scheme.
 */
export function useColorScheme() {
    const { colorScheme } = useNativeWindColorScheme();
    return colorScheme ?? "light";
}
