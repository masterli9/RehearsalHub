import { Pressable, Text, TextInput, useColorScheme, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBand } from "../../context/BandContext";

export default function Band() {
    const systemScheme = useColorScheme();
    const { bands, activeBand, switchBand, createBand } = useBand();

    return (
        <LinearGradient
            colors={
                systemScheme === "dark"
                    ? ["rgba(172, 70, 255, 0.46)", "#0A0A0A"]
                    : ["rgba(172, 70, 255, 0.46)", "#ffffffff"]
            }
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            className='flex-1 items-center justify-center p-3'>
            <SafeAreaView>
                <Text className='text-lg font-bold mb-4'>
                    Aktivní kapela: {activeBand?.name || "Žádná"}
                </Text>

                {bands.map(
                    (b: { id: string; name: string; inviteCode: string }) => (
                        <Pressable
                            key={b.id}
                            onPress={() => switchBand(b.id)}
                            style={{
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor:
                                    activeBand?.id === b.id
                                        ? "#AC46FF"
                                        : "#ececec",
                                marginBottom: 8,
                                alignItems: "center",
                            }}>
                            <Text
                                style={{
                                    color:
                                        activeBand?.id === b.id
                                            ? "#fff"
                                            : "#232323",
                                    fontWeight: "bold",
                                }}>
                                {b.name}
                            </Text>
                        </Pressable>
                    )
                )}

                <Pressable
                    onPress={() => createBand("Nová kapela")}
                    style={{
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: "#232323",
                        alignItems: "center",
                        marginTop: 16,
                    }}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        Vytvořit kapelu
                    </Text>
                </Pressable>
            </SafeAreaView>
        </LinearGradient>
    );
}
