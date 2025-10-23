import { Image } from "expo-image";
import { Pressable, StyleSheet, Text } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";

export default function HomeScreen() {
    const { logout, user } = useAuth();

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
            headerImage={
                <Image
                    source={require("@/assets/images/partial-react-logo.png")}
                    style={styles.reactLogo}
                />
            }
        >
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">
                    Welcome{" "}
                    {user != null ? (user.email ?? "no user") : "no user"}!
                </ThemedText>
                <HelloWave />
            </ThemedView>
            <Pressable
                className="bg-black dark:bg-white rounded-m p-2 active:bg-accent-dark dark:active:bg-accent-light active:scale-95"
                onPress={() => logout()}
            >
                <Text className="text-base font-bold text-white dark:text-black">
                    Log out
                </Text>
            </Pressable>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: "absolute",
    },
});
