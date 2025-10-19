import {
    Text,
    TextInput,
    useColorScheme,
    View,
    Modal,
    Pressable,
    ScrollView,
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
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-root-toast";

export default function Band() {
    const systemScheme = useColorScheme();
    const { user } = useAuth();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [bandMembers, setBandMembers] = useState<any[]>([]);
    const [memberCount, setMemberCount] = useState(0);

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
        fetchBandMembers,
    } = useBand();

    useEffect(() => {
        fetchUserBands(user?.uid || "demo_user");
        fetchRoles();
    }, []);
    useEffect(() => {
        if (activeBand?.id) {
            const data = fetchBandMembers(activeBand.id);
            data.then((members) => {
                setBandMembers(members);
                setMemberCount(members.length || 0);
            });
        } else {
            // Clear members when no active band
            setBandMembers([]);
            setMemberCount(0);
        }
    }, [activeBand]);

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
            className='flex-1 items-center justify-center w-full'>
            <SafeAreaView
                className={`flex-1 w-full items-center ${bands.length === 0 ? "justify-center p-4" : "justify-start"}`}>
                {bands.length === 0 ? (
                    <>
                        <View className='flex-col w-full items-center justify-center bg-darkWhite dark:bg-boxBackground-dark p-5 rounded-2xl'>
                            <Text className='text-3xl font-bold text-black dark:text-white my-2 text-center'>
                                You don't have a band yet!
                            </Text>
                            <Text className='text-silverText mb-2 text-center'>
                                Create a new band or join an existing one.
                            </Text>
                            <View className='flex-row gap-4 w-full justify-center items-center my-3'>
                                <StyledButton
                                    title='Create a band'
                                    onPress={() => setShowCreateModal(true)}
                                />
                                <StyledButton
                                    title='Join a band'
                                    onPress={() => setShowJoinModal(true)}
                                />
                            </View>
                            <Modal
                                visible={showCreateModal}
                                animationType='fade'
                                transparent
                                onRequestClose={() =>
                                    setShowCreateModal(false)
                                }>
                                <Pressable
                                    onPress={() => setShowCreateModal(false)}
                                    className='absolute top-0 left-0 right-0 bottom-0 flex-1 justify-center items-center bg-black/70'>
                                    <KeyboardAwareScrollView
                                        keyboardShouldPersistTaps='handled'
                                        contentContainerStyle={{
                                            flexGrow: 1,
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}>
                                        <Pressable
                                            onPress={() => {}}
                                            className='bg-darkWhite dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark p-5 flex-col justify-center items-center w-80 rounded-2xl'>
                                            <Text className='text-3xl font-bold text-black dark:text-white my-2'>
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
                                                validateOnChange={false}>
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
                                                            placeholder='Band name'
                                                            placeholderTextColor='#A1A1A1'
                                                            className='w-full p-3 bg-white dark:bg-darkGray my-4 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark'
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
                                                                <Text className='text-red-500 mb-3'>
                                                                    {
                                                                        errors.bandName
                                                                    }
                                                                </Text>
                                                            )}
                                                        <View className='flex-row gap-4 w-full justify-center items-center my-3'>
                                                            <StyledButton
                                                                onPress={() =>
                                                                    setShowCreateModal(
                                                                        false
                                                                    )
                                                                }
                                                                title='Cancel'
                                                            />
                                                            <StyledButton
                                                                onPress={() =>
                                                                    handleSubmit()
                                                                }
                                                                title='Submit'
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
                                animationType='fade'
                                transparent
                                onRequestClose={() => setShowJoinModal(false)}>
                                <Pressable
                                    onPress={() => setShowJoinModal(false)}
                                    className='absolute top-0 left-0 right-0 bottom-0 flex-1 justify-center items-center bg-black/70'>
                                    <KeyboardAwareScrollView
                                        keyboardShouldPersistTaps='handled'
                                        contentContainerStyle={{
                                            flexGrow: 1,
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}>
                                        <Pressable
                                            onPress={() => {}}
                                            className='bg-darkWhite dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark p-5 flex-col justify-center items-center w-80 rounded-2xl'>
                                            <Text className='text-3xl font-bold text-black dark:text-white my-2'>
                                                Join a band
                                            </Text>
                                            <Text className='text-base font-regular text-silverText text-center mb-2'>
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
                                                validateOnChange={false}>
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
                                                            placeholder='Join code'
                                                            placeholderTextColor='#A1A1A1'
                                                            className='w-full p-3 bg-white dark:bg-darkGray my-4 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark'
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
                                                                <Text className='text-red-500 mb-3'>
                                                                    {
                                                                        errors.joinCode
                                                                    }
                                                                </Text>
                                                            )}
                                                        <Text className='text-base font-regular text-silverText text-center mb-2'>
                                                            Select your role(s)
                                                            in the band:
                                                        </Text>
                                                        <View className='flex-row flex-wrap gap-2 w-full justify-center items-center my-2'>
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
                                                                            }`}>
                                                                            <Text
                                                                                className={`${
                                                                                    isSelected
                                                                                        ? "text-black dark:text-white font-semibold"
                                                                                        : "text-gray-700 dark:text-gray-200"
                                                                                }`}>
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
                                                        <View className='flex-row gap-4 w-full justify-center items-center my-3'>
                                                            <StyledButton
                                                                onPress={() =>
                                                                    setShowJoinModal(
                                                                        false
                                                                    )
                                                                }
                                                                title='Cancel'
                                                            />
                                                            <StyledButton
                                                                onPress={() =>
                                                                    handleSubmit()
                                                                }
                                                                title='Submit'
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
                    <>
                        <View className='flex-col justify-center items-start w-full border-b border-accent-light dark:border-accent-dark my-4 w-full px-5 py-2'>
                            <Text className='text-black dark:text-white text-2xl font-bold my-1'>
                                {activeBand?.name}
                            </Text>
                            <Text className='text-silverText'>
                                {memberCount} members
                            </Text>
                            {/* TODO: Make a fetch for COUNT of members */}
                        </View>
                        <ScrollView
                            className='flex-col px-3 w-full'
                            contentContainerStyle={{
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                            <View className='bg-darkWhite dark:bg-darkGray w-full p-5 rounded-2xl flex-row items-center justify-between border border-accent-light dark:border-accent-dark mb-5'>
                                <View className='flex-col items-start justify-center w-2/3'>
                                    <Text className='text-black dark:text-white text-xl font-bold my-1'>
                                        Invite Code
                                    </Text>
                                    <Text className='text-silverText text-base'>
                                        Share this invite code with your members
                                    </Text>
                                </View>
                                <Pressable
                                    className='border border-silverText rounded-lg p-1 active:scale-90'
                                    onPress={async () => {
                                        const code =
                                            activeBand?.inviteCode || "";

                                        if (!code) return;

                                        await Clipboard.setStringAsync(code);

                                        Toast.show("Invite code copied!", {
                                            duration: Toast.durations.SHORT,
                                            position: Toast.positions.TOP,
                                            shadow: true,
                                            animation: true,
                                            backgroundColor: "#333",
                                            textColor: "#fff",
                                            opacity: 0.9,
                                            hideOnPress: true,
                                        });
                                    }}
                                    // TODO: Fix toast
                                >
                                    <Text className='text-black dark:text-white'>
                                        {activeBand?.inviteCode}
                                    </Text>
                                </Pressable>
                            </View>
                            {bandMembers.map((member, idx) => (
                                <View
                                    key={
                                        member.firebase_uid ||
                                        member.id ||
                                        member.email ||
                                        idx
                                    }
                                    className='bg-boxBackground-light dark:bg-boxBackground-dark w-full p-5 rounded-2xl flex-row items-center justify-between border border-accent-light dark:border-accent-dark my-1'>
                                    <View className='flex-col items-start justify-center'>
                                        <View className='flex-row'>
                                            <Text className='text-black dark:text-white text-xl font-bold my-1'>
                                                {member.username}
                                            </Text>
                                            {(Array.isArray(member.roles)
                                                ? member.roles.slice(0, 2)
                                                : []
                                            ).map((r: any, i: number) => (
                                                <Text
                                                    key={
                                                        typeof r === "string"
                                                            ? r
                                                            : r.role_id ||
                                                              r.title ||
                                                              i
                                                    }
                                                    className='text-black dark:text-white text-base my-1 bg-accent-light dark:bg-accent-dark px-3 py-1 rounded-xl ml-2'>
                                                    {typeof r === "string"
                                                        ? r
                                                        : r.title}
                                                </Text>
                                            ))}
                                            {Array.isArray(member.roles) &&
                                                member.roles.length > 2 && (
                                                    <Text className='text-black dark:text-white text-base my-1 bg-accent-light dark:bg-accent-dark px-3 py-1 rounded-xl ml-2'>
                                                        +
                                                        {member.roles.length -
                                                            2}
                                                    </Text>
                                                )}
                                        </View>
                                        <Text className='text-silverText text-base'>
                                            {member.email}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}
