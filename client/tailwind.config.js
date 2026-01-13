/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
        "./global.css",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            borderRadius: {
                m: "12px",
            },
            colors: {
                boxBackground: {
                    light: "#FFFFFF",
                    dark: "#0A0A0A",
                },
                silverText: "#A1A1A1",
                accent: {
                    light: "#EDEDED",
                    dark: "#262626",
                },
                darkGray: "#171717",
                darkWhite: "#FAFAFA",
                black: "#0A0A0A",
                blue: "#2B7FFF",
                transparentBlue: "rgba(43, 128, 255, 0.2)",
                orange: "#F0B100",
                green: "#00C950",
                transparentGreen: "rgba(0, 201, 80, 0.2)",
                violet: "#AD46FF",
                transparentViolet: "rgba(173, 70, 255, 0.2)",
                pink: "#F6339A",
                darkOrange: "#FF6900",
                black: "#0A0A0A",
                darkRed: "#d61515",
            },
            fontFamily: {
                bold: ["Segoe UI", "sans-serif"],
                regular: ["Segoe UI-Regular", "sans-serif"],
                semibold: ["Segoe UI-SemiBold", "sans-serif"],
                medium: ["Segoe UI-Medium", "sans-serif"],
                light: ["Segoe UI-Light", "sans-serif"],
                italic: ["Segoe UI-Italic", "sans-serif"],
            },
        },
    },
    plugins: [],
    darkMode: "class",
};
