import { Pressable, Text, TextInput, useColorScheme, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBand } from "../../context/BandContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

export default function Band() {
    const systemScheme = useColorScheme();
    const { user } = useAuth();

    const {
        bands,
        activeBand,
        switchBand,
        createBand,
        joinBandByCode,
        fetchUserBands,
    } = useBand();

    useEffect(() => {
        fetchUserBands(user?.uid || "demo_user");
    }, []);

    return (
        <LinearGradient
            colors={
                systemScheme === "dark"
                    ? ["rgba(172, 70, 255, 0.46)", "#0A0A0A"]
                    : ["rgba(172, 70, 255, 0.46)", "#ffffffff"]
            }
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            className="flex-1 items-center justify-center p-3"
        >
            <SafeAreaView>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-lg font-bold mb-4">
                        Aktivní kapela: {activeBand?.name || "Žádná"}
                    </Text>

                    {bands.map((b) => (
                        <Pressable
                            key={b.id}
                            onPress={() => switchBand(b.id)}
                            className="bg-black dark:bg-white rounded-m p-2 my-2 w-56 active:bg-accent-dark dark:active:bg-accent-light active:scale-95"
                        >
                            <Text className="text-base font-bold text-white dark:text-black text-center">
                                {b.name}
                            </Text>
                        </Pressable>
                    ))}

                    <Pressable
                        onPress={() => createBand("Nová kapela")}
                        className="bg-black dark:bg-white rounded-m p-2 my-2 w-56 active:bg-accent-dark dark:active:bg-accent-light active:scale-95"
                    >
                        <Text className="text-base font-bold text-white dark:text-black text-center">
                            Vytvořit kapelu
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => joinBandByCode("ABC123")}
                        className="bg-black dark:bg-white rounded-m p-2 my-2 w-56 active:bg-accent-dark dark:active:bg-accent-light active:scale-95"
                    >
                        <Text className="text-base font-bold text-white dark:text-black text-center">
                            Připojit se pomocí kódu
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}
