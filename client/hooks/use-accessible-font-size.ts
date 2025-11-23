import { PixelRatio } from 'react-native';

/**
 * Hook to get font sizes that scale with system accessibility settings
 * This multiplies base font sizes by the device's font scale setting
 */
export function useAccessibleFontSize() {
    const fontScale = PixelRatio.getFontScale();

    return {
        fontScale,
        // Tailwind text size equivalents
        xs: 12 * fontScale,
        sm: 14 * fontScale,
        base: 16 * fontScale,
        lg: 18 * fontScale,
        xl: 20 * fontScale,
        '2xl': 24 * fontScale,
        '3xl': 30 * fontScale,
        '4xl': 36 * fontScale,
    };
}

