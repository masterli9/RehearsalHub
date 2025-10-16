import {
    Text,
    TextInput,
    useColorScheme,
    View,
    Modal,
    Pressable,
    Role,
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
import apiUrl from "@/config";
import { BandRole } from "../../context/BandContext";

export default function Band() {
    const systemScheme = useColorScheme();
    const { user } = useAuth();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const [roles, setRoles] = useState([]);
    const fetchRoles = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/bands/roles`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            setRoles(data);
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

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
        fetchRoles();
    }, []);

    const createBandSchema = Yup.object().shape({
        bandName: Yup.string()
            .min(2, "Band name should be at least 2 characters")
            .max(255, "Band name should be less than 255 characters")
            .required("Band name is required"),
    });
    const joinBandSchema = Yup.object().shape({
        joinCode: Yup.string()
            .max(255, "Code should be less than 255 characters")
            .required("Invite code is required"),
        roles: Yup.array().required("Select at least one role"),
    });
    type JoinFormValues = {
        joinCode: string;
        roles: BandRole[];
    };

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
                                    onPress={() => setShowCreateModal(true)}
                                />
                                <StyledButton
                                    title="Join a band"
                                    onPress={() => setShowJoinModal(true)}
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
                                            className="bg-darkWhite dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark p-5 flex-col justify-center items-center w-80 rounded-2xl"
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
                            {/* Join modal */}
                            <Modal
                                visible={showJoinModal}
                                animationType="fade"
                                transparent
                                onRequestClose={() => setShowJoinModal(false)}
                            >
                                <Pressable
                                    onPress={() => setShowJoinModal(false)}
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
                                            className="bg-darkWhite dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark p-5 flex-col justify-center items-center w-80 rounded-2xl"
                                        >
                                            <Text className="text-3xl font-bold text-black dark:text-white my-2">
                                                Join a band
                                            </Text>
                                            <Text className="text-base font-regular text-silverText text-center mb-2">
                                                Your band leader should provide
                                                you a join code.
                                            </Text>
                                            <Formik<JoinFormValues>
                                                validationSchema={
                                                    joinBandSchema
                                                }
                                                initialValues={{
                                                    joinCode: "",
                                                    roles: [],
                                                }}
                                                onSubmit={(values) => {
                                                    joinBandByCode(
                                                        values.joinCode.toUpperCase(),
                                                        values.roles
                                                    );
                                                    setShowJoinModal(false);
                                                }}
                                                validateOnBlur={false}
                                                validateOnChange={false}
                                            >
                                                {({
                                                    handleChange,
                                                    handleBlur,
                                                    handleSubmit,
                                                    setFieldValue,
                                                    values,
                                                    errors,
                                                    touched,
                                                    submitCount,
                                                }) => (
                                                    <>
                                                        <TextInput
                                                            placeholder="Join code"
                                                            placeholderTextColor="#A1A1A1"
                                                            className="w-full p-3 bg-white dark:bg-darkGray my-4 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark"
                                                            value={
                                                                values.joinCode
                                                            }
                                                            onChangeText={handleChange(
                                                                "joinCode"
                                                            )}
                                                            onBlur={handleBlur(
                                                                "joinCode"
                                                            )}
                                                        />
                                                        {(touched.joinCode ||
                                                            submitCount > 0) &&
                                                            errors.joinCode && (
                                                                <Text className="text-red-500 mb-3">
                                                                    {
                                                                        errors.joinCode
                                                                    }
                                                                </Text>
                                                            )}
                                                        <Text className="text-base font-regular text-silverText text-center mb-2">
                                                            Select your role(s)
                                                            in the band:
                                                        </Text>
                                                        <View className="flex-row flex-wrap gap-2 w-full justify-center items-center my-2">
                                                            {roles.map(
                                                                (
                                                                    role: BandRole
                                                                ) => {
                                                                    const isSelected =
                                                                        values.roles.some(
                                                                            (
                                                                                r
                                                                            ) =>
                                                                                r.role_id ===
                                                                                role.role_id
                                                                        );

                                                                    return (
                                                                        <Pressable
                                                                            key={
                                                                                role.role_id
                                                                            }
                                                                            onPress={() => {
                                                                                if (
                                                                                    isSelected
                                                                                ) {
                                                                                    setFieldValue(
                                                                                        "roles",
                                                                                        values.roles.filter(
                                                                                            (
                                                                                                r
                                                                                            ) =>
                                                                                                r.role_id !==
                                                                                                role.role_id
                                                                                        )
                                                                                    );
                                                                                } else {
                                                                                    setFieldValue(
                                                                                        "roles",
                                                                                        [
                                                                                            ...values.roles,
                                                                                            role,
                                                                                        ]
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className={`px-2 py-1 rounded-m border ${
                                                                                isSelected
                                                                                    ? "bg-transparentGreen border-green"
                                                                                    : "bg-transparent border-gray-400"
                                                                            }`}
                                                                        >
                                                                            <Text
                                                                                className={`${
                                                                                    isSelected
                                                                                        ? "text-black dark:text-white font-semibold"
                                                                                        : "text-gray-700 dark:text-gray-200"
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    role.title
                                                                                }
                                                                            </Text>
                                                                        </Pressable>
                                                                    );
                                                                }
                                                            )}
                                                        </View>
                                                        {/* {(touched.roles ||
                                                            submitCount > 0) &&
                                                            errors.roles && (
                                                                <Text className="text-red-500 mb-3">
                                                                    {
                                                                        errors.roles
                                                                    }
                                                                </Text>
                                                            )} */}
                                                        <View className="flex-row gap-4 w-full justify-center items-center my-3">
                                                            <StyledButton
                                                                onPress={() =>
                                                                    setShowJoinModal(
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
