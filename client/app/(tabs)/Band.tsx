import { Text, TextInput, useColorScheme, View, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBand } from "../../context/BandContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import StyledButton from "@/components/StyledButton";
import { useState } from "react";

export default function Band() {
    const systemScheme = useColorScheme();
    const { user } = useAuth();

    const [showCreateModal, setShowCreateModal] = useState(false);

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

    const handleCreateBand = () => {
        setShowCreateModal(true);
    };

    const handleJoinBandByCode = () => {};

    return (
        <LinearGradient
            colors={
                systemScheme === "dark"
                    ? ["rgba(172, 70, 255, 0.46)", "#0A0A0A"]
                    : ["rgba(172, 70, 255, 0.46)", "#ffffffff"]
            }
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            className='flex-1 items-center justify-center p-3 w-full'>
            <SafeAreaView>
                {bands.length === 0 ? (
                    <>
                        <View className='flex-col items-center justify-center bg-darkWhite dark:bg-boxBackground-dark p-5 rounded-2xl'>
                            <Text className='text-3xl font-bold text-black dark:text-white my-2'>
                                You don't have a band yet!
                            </Text>
                            <Text className='text-silverText mb-2'>
                                Create a new band or join an existing one.
                            </Text>
                            <View className='flex-row gap-4 w-full justify-center items-center my-3'>
                                <StyledButton
                                    title='Create a band'
                                    onPress={() => handleCreateBand()}
                                />
                                <StyledButton
                                    title='Join a band'
                                    onPress={() => handleJoinBandByCode()}
                                />
                            </View>
                            <Modal
                                visible={showCreateModal}
                                animationType='slide'
                                transparent
                                onRequestClose={() =>
                                    setShowCreateModal(false)
                                }>
                                <View className='bg-darkWhite dark:bg-boxBackground-dark p-5 flex-col justify-center items-center'>
                                    <Text className='text-3xl font-bold text-black dark:text-white my-2'>
                                        Create a band
                                    </Text>
                                    <TextInput
                                        placeholder='Band name'
                                        placeholderTextColor='#A1A1A1'
                                        className='w-full p-3 bg-white dark:bg-darkGray my-4 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark'
                                        // value={values.email}
                                        // onChangeText={handleChange("email")}
                                        // onBlur={handleBlur("email")}
                                        keyboardType='email-address'
                                        autoCapitalize='none'
                                    />
                                    <TextInput
                                        placeholder='Band name'
                                        placeholderTextColor='#A1A1A1'
                                        className='w-full p-3 bg-white dark:bg-darkGray my-4 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark'
                                        // value={values.email}
                                        // onChangeText={handleChange("email")}
                                        // onBlur={handleBlur("email")}
                                        keyboardType='email-address'
                                        autoCapitalize='none'
                                    />
                                </View>
                                <StyledButton
                                    onPress={() => setShowCreateModal(false)}
                                    title='Cancel'
                                />
                            </Modal>
                        </View>
                    </>
                ) : (
                    <></>
                )}

                {/* <View className='flex-1 items-center justify-center'>
                    <Text className='text-lg font-bold mb-4'>
                        Active band: {activeBand?.name || "None"}
                    </Text>

                    {bands.map((b) => (
                        <Pressable
                            key={b.id}
                            onPress={() => switchBand(b.id)}
                            className='bg-black dark:bg-white rounded-m p-2 my-2 w-56 active:bg-accent-dark dark:active:bg-accent-light active:scale-95'>
                            <Text className='text-base font-bold text-white dark:text-black text-center'>
                                {b.name}
                            </Text>
                        </Pressable>
                    ))}

                    <Pressable
                        onPress={() => createBand("Nová kapela")}
                        className='bg-black dark:bg-white rounded-m p-2 my-2 w-56 active:bg-accent-dark dark:active:bg-accent-light active:scale-95'>
                        <Text className='text-base font-bold text-white dark:text-black text-center'>
                            Vytvořit kapelu
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => joinBandByCode("ABC123")}
                        className='bg-black dark:bg-white rounded-m p-2 my-2 w-56 active:bg-accent-dark dark:active:bg-accent-light active:scale-95'>
                        <Text className='text-base font-bold text-white dark:text-black text-center'>
                            Připojit se pomocí kódu
                        </Text>
                    </Pressable>
                </View> */}
            </SafeAreaView>
        </LinearGradient>
    );
}
