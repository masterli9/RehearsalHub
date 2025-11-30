import { PixelRatio } from "react-native";

/**
 * Hook to get font sizes that scale with system accessibility settings
 * This multiplies base font sizes by the device's font scale setting
 */
export function useAccessibleFontSize() {
    const fontScale = PixelRatio.getFontScale();

    return {
        fontScale,
        // Adjusted to industry standard sizes (iOS & Android defaults)
        xs: 11 * fontScale,
        sm: 12 * fontScale,
        base: 13 * fontScale,
        lg: 15 * fontScale,
        xl: 17 * fontScale,
        "2xl": 19 * fontScale,
        "3xl": 21 * fontScale,
        "4xl": 23 * fontScale,
    };
}
