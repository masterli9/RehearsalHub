export default {
    expo: {
        name: "RehearsalHub",
        slug: "rehearsalhub",
        owner: "sterli",
        scheme: "com.sterli.rehearsalhub",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/RehearsalHubIcon.png",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            infoPlist: {
                UIBackgroundModes: ["audio"],
            },
            bundleIdentifier: "com.sterli.rehearsalhub",
        },
        android: {
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png",
            },
            package: "com.sterli.rehearsalhub",
            googleServicesFile:
                process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            softwareKeyboardLayoutMode: "resize",
            windowSoftInputMode: "adjustResize",
            permissions: ["FOREGROUND_SERVICE", "WAKE_LOCK"],
        },
        web: {
            output: "static",
            favicon: "./assets/images/RehearsalHubIcon.png",
            bundler: "metro",
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/RehearsalHubIcon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#000000",
                    dark: {
                        backgroundColor: "#000000",
                    },
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },
        extra: {
            router: {},
            eas: {
                projectId: "119900ec-d11a-4905-8653-da584c1b3a07",
            },
        },
    },
};
