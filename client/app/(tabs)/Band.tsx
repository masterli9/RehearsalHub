import {
    Text,
    TextInput,
    useColorScheme,
    View,
    Modal,
    TouchableOpacity,
    Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBand } from "../../context/BandContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import StyledButton from "@/components/StyledButton";
import { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Formik } from "formik";
import * as Yup from "yup";

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

    const createBandSchema = Yup.object().shape({
        bandName: Yup.string()
            .min(2, "Band name should be at least 2 characters")
            .max(255, "Band name should be less than 255 characters")
            .required("Band name is required"),
    });

    return (
        <LinearGradient
            colors={
                systemScheme === "dark"
                    ? ["rgba(172, 70, 255, 0.46)", "#0A0A0A"]
                    : ["rgba(172, 70, 255, 0.46)", "#ffffffff"]
            }
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            className="flex-1 items-center justify-center p-3 w-full"
        >
            <SafeAreaView>
                {bands.length === 0 ? (
                    <>
                        <View className="flex-col items-center justify-center bg-darkWhite dark:bg-boxBackground-dark p-5 rounded-2xl">
                            <Text className="text-3xl font-bold text-black dark:text-white my-2">
                                You don't have a band yet!
                            </Text>
                            <Text className="text-silverText mb-2">
                                Create a new band or join an existing one.
                            </Text>
                            <View className="flex-row gap-4 w-full justify-center items-center my-3">
                                <StyledButton
                                    title="Create a band"
                                    onPress={() => handleCreateBand()}
                                />
                                <StyledButton
                                    title="Join a band"
                                    onPress={() => handleJoinBandByCode()}
                                />
                            </View>
                            <Modal
                                visible={showCreateModal}
                                animationType="fade"
                                transparent
                                onRequestClose={() => setShowCreateModal(false)}
                            >
                                <Pressable
                                    onPress={() => setShowCreateModal(false)}
                                    className="absolute top-0 left-0 right-0 bottom-0 flex-1 justify-center items-center bg-black/70"
                                >
                                    <KeyboardAwareScrollView
                                        keyboardShouldPersistTaps="handled"
                                        contentContainerStyle={{
                                            flexGrow: 1,
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Pressable
                                            onPress={() => {}}
                                            className="bg-darkWhite dark:bg-boxBackground-dark p-5 flex-col justify-center items-center w-80 rounded-2xl"
                                        >
                                            <Text className="text-3xl font-bold text-black dark:text-white my-2">
                                                Create a band
                                            </Text>
                                            <Formik
                                                validationSchema={
                                                    createBandSchema
                                                }
                                                initialValues={{
                                                    bandName: "",
                                                }}
                                                onSubmit={(values) => {
                                                    createBand(values.bandName);
                                                    setShowCreateModal(false);
                                                }}
                                                validateOnBlur={false}
                                                validateOnChange={false}
                                            >
                                                {({
                                                    handleChange,
                                                    handleBlur,
                                                    handleSubmit,
                                                    values,
                                                    errors,
                                                    touched,
                                                    submitCount,
                                                }) => (
                                                    <>
                                                        <TextInput
                                                            placeholder="Band name"
                                                            placeholderTextColor="#A1A1A1"
                                                            className="w-full p-3 bg-white dark:bg-darkGray my-4 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark"
                                                            value={
                                                                values.bandName
                                                            }
                                                            onChangeText={handleChange(
                                                                "bandName"
                                                            )}
                                                            onBlur={handleBlur(
                                                                "bandName"
                                                            )}
                                                        />
                                                        {(touched.bandName ||
                                                            submitCount > 0) &&
                                                            errors.bandName && (
                                                                <Text className="text-red-500 mb-3">
                                                                    {
                                                                        errors.bandName
                                                                    }
                                                                </Text>
                                                            )}
                                                        <View className="flex-row gap-4 w-full justify-center items-center my-3">
                                                            <StyledButton
                                                                onPress={() =>
                                                                    setShowCreateModal(
                                                                        false
                                                                    )
                                                                }
                                                                title="Cancel"
                                                            />
                                                            <StyledButton
                                                                onPress={() =>
                                                                    handleSubmit()
                                                                }
                                                                title="Submit"
                                                            />
                                                        </View>
                                                    </>
                                                )}
                                            </Formik>
                                        </Pressable>
                                    </KeyboardAwareScrollView>
                                </Pressable>
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
