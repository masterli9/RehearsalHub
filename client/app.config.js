export default {
    expo: {
        name: "RehearsalHub",
        slug: "rehearsalhub",
        owner: "sterli",
        scheme: "com.sterli.rehearsalhub",
        version: "0.1.1",
        orientation: "portrait",
        icon: "./assets/images/icon-standard.png",
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
                foregroundImage: "./assets/images/android-adaptive-foreground.png",
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
            [
                "expo-build-properties",
                {
                    android: {
                        usesCleartextTraffic: true,
                    },
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },
        notification: {
            icon: "./assets/images/notification-icon.png",
            color: "#E6F4FE",
        },
        extra: {
            router: {},
            eas: {
                projectId: "119900ec-d11a-4905-8653-da584c1b3a07",
            },
        },
    },
};
