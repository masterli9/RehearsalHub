import Card from "@/components/Card";
import ErrorText from "@/components/ErrorText";
import PageContainer from "@/components/PageContainer";
import StyledButton from "@/components/StyledButton";
import StyledModal from "@/components/StyledModal";
import StyledTextInput from "@/components/StyledTextInput";
import { SwitchBandModal } from "@/components/SwitchBandModal";
import apiUrl from "@/config";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import * as Clipboard from "expo-clipboard";
import { Formik } from "formik";
import { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
    View,
} from "react-native";
import {
    Menu,
    MenuOption,
    MenuOptions,
    MenuTrigger,
    renderers,
} from "react-native-popup-menu";
import Toast from "react-native-root-toast";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { BandRole, useBand } from "../../context/BandContext";

export default function Band() {
    const { SlideInMenu } = renderers;
    const systemScheme = useColorScheme();
    const { user } = useAuth();
    const fontSize = useAccessibleFontSize();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [bandMembers, setBandMembers] = useState<any[]>([]);
    const [memberCount, setMemberCount] = useState(0);
    const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
    const [confirmLeaveModal, setConfirmLeaveModal] = useState(false);

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
            setRoles(data.filter((role: BandRole) => role.title !== "Leader"));
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
        removeBandMember,
        makeLeader,
    } = useBand();

    const loadBandMembers = async () => {
        if (activeBand?.id) {
            try {
                const members = await fetchBandMembers(activeBand.id);
                setBandMembers(members.members);
                setMemberCount(members.members.length || 0);
                setCurrentUserRoles(members.currentUserRoles);
            } catch (error) {
                console.error("Error loading band members:", error);
                setBandMembers([]);
                setMemberCount(0);
                setCurrentUserRoles([]);
            }
        } else {
            // Clear members when no active band
            setBandMembers([]);
            setMemberCount(0);
            setCurrentUserRoles([]);
        }
    };

    const handleRemoveMember = async (bandId: string, firebaseUid: string) => {
        try {
            await removeBandMember(bandId, firebaseUid);

            // If removing another member (not yourself), update the local state
            if (firebaseUid !== user?.uid) {
                setBandMembers(
                    bandMembers.filter(
                        (member: any) => member.firebase_uid !== firebaseUid
                    )
                );
                setMemberCount(memberCount - 1);
            }

            // Refresh bands list to ensure consistency (in case band was deleted)
            await fetchUserBands(user?.uid || "demo_user");

            // Reset the modal state after leaving
            setConfirmLeaveModal(false);
        } catch (error) {
            console.error("Error removing member:", error);
            setConfirmLeaveModal(false);
        }
    };

    const handleMakeLeader = async (firebaseUid: string) => {
        try {
            if (!activeBand?.id) {
                Alert.alert("Error", "No active band");
                return;
            }

            await makeLeader(activeBand.id, firebaseUid);

            // Refresh the members list to show updated roles
            await loadBandMembers();

            Alert.alert("Success", "Leader role transferred successfully");
        } catch (error: any) {
            console.error("Error making leader:", error);
            Alert.alert(
                "Error",
                error.message || "Failed to transfer leader role"
            );
        }
    };

    useEffect(() => {
        fetchUserBands(user?.uid || "demo_user");
        fetchRoles();
    }, []);
    useEffect(() => {
        loadBandMembers();
    }, [activeBand]);

    useEffect(() => {
        if (confirmLeaveModal) {
            if (currentUserRoles.includes("Leader")) {
                Alert.alert(
                    "You are the leader of this band. You cannot leave the band.",
                    "Give someone else the leader role to leave the band.",
                    [{ text: "OK", onPress: () => setConfirmLeaveModal(false) }]
                );
                setConfirmLeaveModal(false);
            } else {
                Alert.alert(
                    "Leave band",
                    "Are you sure you want to leave " + activeBand?.name + "?",
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => setConfirmLeaveModal(false),
                        },
                        {
                            text: "Leave",
                            onPress: () => {
                                handleRemoveMember(
                                    activeBand?.id || "",
                                    user?.uid || ""
                                );
                            },
                        },
                    ]
                );
            }
        }
    }, [confirmLeaveModal]);

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
    type CreateFormValues = {
        bandName: string;
        roles: BandRole[];
    };

    const [showSwitchModal, setShowSwitchModal] = useState(false);

    return (
        <PageContainer noBandState={bands.length === 0}>
            <StyledModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title='Create a band'>
                <Formik<CreateFormValues>
                    validationSchema={createBandSchema}
                    initialValues={{
                        bandName: "",
                        roles: [],
                    }}
                    onSubmit={async (values) => {
                        try {
                            await createBand(values.bandName, values.roles);
                            setShowCreateModal(false);
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error.message || "Failed to create band. Please try again."
                            );
                        }
                    }}
                    validateOnBlur={false}
                    validateOnChange={false}>
                    {({
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        values,
                        setFieldValue,
                        errors,
                        touched,
                        submitCount,
                    }) => (
                        <>
                            <StyledTextInput
                                placeholder='Band name'
                                className='my-4'
                                value={values.bandName}
                                onChangeText={handleChange("bandName")}
                                onBlur={handleBlur("bandName")}
                            />
                            {(touched.bandName || submitCount > 0) &&
                                errors.bandName && (
                                    <ErrorText>{errors.bandName}</ErrorText>
                                )}
                            <Text
                                className='font-regular text-silverText text-center mb-2'
                                style={{ fontSize: fontSize.base }}>
                                Select your role(s) in the band:
                            </Text>
                            <View className='flex-row flex-wrap gap-2 w-full justify-center items-center my-2'>
                                {roles.map((role: BandRole) => {
                                    const isSelected = values.roles.some(
                                        (r) => r.role_id === role.role_id
                                    );

                                    return (
                                        <Pressable
                                            key={role.role_id}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setFieldValue(
                                                        "roles",
                                                        values.roles.filter(
                                                            (r) =>
                                                                r.role_id !==
                                                                role.role_id
                                                        )
                                                    );
                                                } else {
                                                    setFieldValue("roles", [
                                                        ...values.roles,
                                                        role,
                                                    ]);
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
                                                {role.title}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            <View className='flex-row gap-4 w-full justify-center items-center my-3'>
                                <StyledButton
                                    onPress={() => setShowCreateModal(false)}
                                    title='Cancel'
                                />
                                <StyledButton
                                    onPress={() => handleSubmit()}
                                    title='Submit'
                                />
                            </View>
                        </>
                    )}
                </Formik>
            </StyledModal>
            {/* Join modal */}
            <StyledModal
                visible={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                title='Join a band'
                subtitle='Your band leader should provide you a join code.'>
                <Formik<JoinFormValues>
                    validationSchema={joinBandSchema}
                    initialValues={{
                        joinCode: "",
                        roles: [],
                    }}
                    onSubmit={async (values) => {
                        try {
                            await joinBandByCode(
                                values.joinCode.toUpperCase(),
                                values.roles
                            );
                            setShowJoinModal(false);
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error.message || "Failed to join band. Please try again."
                            );
                        }
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
                            <StyledTextInput
                                placeholder='Join code'
                                className='my-4'
                                value={values.joinCode}
                                onChangeText={handleChange("joinCode")}
                                onBlur={handleBlur("joinCode")}
                            />
                            {(touched.joinCode || submitCount > 0) &&
                                errors.joinCode && (
                                    <ErrorText>{errors.joinCode}</ErrorText>
                                )}
                            <Text
                                className='font-regular text-silverText text-center mb-2'
                                style={{ fontSize: fontSize.base }}>
                                Select your role(s) in the band:
                            </Text>
                            <View className='flex-row flex-wrap gap-2 w-full justify-center items-center my-2'>
                                {roles.map((role: BandRole) => {
                                    const isSelected = values.roles.some(
                                        (r) => r.role_id === role.role_id
                                    );

                                    return (
                                        <Pressable
                                            key={role.role_id}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setFieldValue(
                                                        "roles",
                                                        values.roles.filter(
                                                            (r) =>
                                                                r.role_id !==
                                                                role.role_id
                                                        )
                                                    );
                                                } else {
                                                    setFieldValue("roles", [
                                                        ...values.roles,
                                                        role,
                                                    ]);
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
                                                {role.title}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
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
                                    onPress={() => setShowJoinModal(false)}
                                    title='Cancel'
                                />
                                <StyledButton
                                    onPress={() => handleSubmit()}
                                    title='Submit'
                                />
                            </View>
                        </>
                    )}
                </Formik>
            </StyledModal>
            {/* Band switch */}
            <SwitchBandModal
                onClose={() => setShowSwitchModal(false)}
                visible={showSwitchModal}
            />
            {bands.length === 0 ? (
                <>
                    <Card className='flex-col w-full items-center justify-center'>
                        <Text
                            className='font-bold text-black dark:text-white my-2 text-center'
                            style={{ fontSize: fontSize["3xl"] }}>
                            You don't have a band yet!
                        </Text>
                        <Text
                            className='text-silverText mb-2 text-center'
                            style={{ fontSize: fontSize.base }}>
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
                    </Card>
                </>
            ) : (
                <>
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark my-4 w-full px-5 py-2'>
                        <View className='flex-col items-start justify-center'>
                            <Text
                                className='text-black dark:text-white font-bold my-1'
                                style={{ fontSize: fontSize["2xl"] }}>
                                {activeBand?.name}
                            </Text>
                            <Text
                                className='text-silverText'
                                style={{ fontSize: fontSize.base }}>
                                {memberCount} members
                            </Text>
                        </View>
                        <View className='flex-row items-center justify-center'>
                            <Menu
                                renderer={SlideInMenu}
                                rendererProps={{ transitionDuration: 200 }}>
                                <MenuTrigger>
                                    <Text
                                        className='text-black dark:text-white p-4'
                                        style={{ fontSize: fontSize["2xl"] }}>
                                        ⋯
                                    </Text>
                                </MenuTrigger>
                                <MenuOptions
                                    customStyles={{
                                        optionsContainer: {
                                            borderRadius: 10,
                                            backgroundColor:
                                                systemScheme === "dark"
                                                    ? "#333"
                                                    : "#fff",
                                        },
                                    }}>
                                    <MenuOption
                                        onSelect={() => {
                                            setShowJoinModal(false);
                                            setShowCreateModal(true);
                                        }}
                                        text='Create new band'
                                        customStyles={{
                                            optionText: {
                                                color:
                                                    systemScheme === "dark"
                                                        ? "#fff"
                                                        : "#333",
                                                paddingVertical: 8,
                                                fontSize: fontSize.base,
                                            },
                                        }}
                                    />
                                    <MenuOption
                                        onSelect={() => {
                                            setShowJoinModal(true);
                                            setShowCreateModal(false);
                                        }}
                                        text='Join new band'
                                        customStyles={{
                                            optionText: {
                                                color:
                                                    systemScheme === "dark"
                                                        ? "#fff"
                                                        : "#333",
                                                paddingVertical: 8,
                                                fontSize: fontSize.base,
                                            },
                                        }}
                                    />
                                    <MenuOption
                                        onSelect={() => {
                                            setShowSwitchModal(true);
                                        }}
                                        text='Switch band'
                                        customStyles={{
                                            optionText: {
                                                color:
                                                    systemScheme === "dark"
                                                        ? "#fff"
                                                        : "#333",
                                                paddingVertical: 8,
                                                fontSize: fontSize.base,
                                            },
                                        }}
                                    />
                                    <MenuOption
                                        onSelect={() =>
                                            setConfirmLeaveModal(true)
                                        }
                                        text='Leave band'
                                        customStyles={{
                                            optionText: {
                                                color: "#d11717",
                                                paddingVertical: 8,
                                                fontSize: fontSize.base,
                                            },
                                        }}
                                    />
                                </MenuOptions>
                            </Menu>
                        </View>
                    </View>
                    <ScrollView
                        className='flex-col px-3 w-full'
                        contentContainerStyle={{
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                        <Card className='bg-darkWhite dark:bg-darkGray w-full flex-row items-center justify-between mb-5'>
                            <View className='flex-col items-start justify-center w-2/3'>
                                <Text
                                    className='text-black dark:text-white font-bold my-1'
                                    style={{ fontSize: fontSize.xl }}>
                                    Invite Code
                                </Text>
                                <Text
                                    className='text-silverText'
                                    style={{ fontSize: fontSize.base }}>
                                    Share this invite code with your members
                                </Text>
                            </View>
                            <Pressable
                                className='border border-silverText rounded-lg p-1 active:scale-90'
                                onPress={async () => {
                                    const code = activeBand?.inviteCode || "";

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
                        </Card>
                        {bandMembers.map((member, idx) => (
                            <Card
                                key={
                                    member.firebase_uid ||
                                    member.id ||
                                    member.email ||
                                    idx
                                }
                                variant='boxBackground'
                                className='w-full flex-row items-center justify-between my-1'>
                                <View className='flex-col items-start justify-center flex-1'>
                                    <View className='flex-row flex-wrap items-center'>
                                        <Text
                                            className='text-black dark:text-white font-bold my-1 mr-2'
                                            numberOfLines={1}
                                            ellipsizeMode='tail'
                                            style={{ fontSize: fontSize.xl }}>
                                            {member.username}
                                        </Text>
                                        {member.roles.length > 0 &&
                                            (Array.isArray(member.roles)
                                                ? member.roles.slice(0, 1)
                                                : []
                                            )
                                                .filter((r: any) => r != null)
                                                .map((r: any, i: number) => (
                                                    <Text
                                                        key={
                                                            typeof r ===
                                                            "string"
                                                                ? r
                                                                : r.role_id ||
                                                                  r.title ||
                                                                  i
                                                        }
                                                        className='text-white my-1 bg-darkGray dark:bg-accent-dark px-3 py-1 rounded-xl mr-2'
                                                        style={{
                                                            fontSize:
                                                                fontSize.base,
                                                        }}>
                                                        {typeof r === "string"
                                                            ? r
                                                            : r?.title || ""}
                                                    </Text>
                                                ))}
                                        {member.roles.length > 0 &&
                                            member.roles.length > 1 && (
                                                <Text
                                                    className='text-white my-1 bg-darkGray dark:bg-accent-dark px-3 py-1 rounded-xl mr-2'
                                                    style={{
                                                        fontSize: fontSize.base,
                                                    }}>
                                                    +{member.roles.length - 1}
                                                </Text>
                                            )}
                                    </View>
                                    <Text
                                        className='text-silverText'
                                        style={{ fontSize: fontSize.base }}>
                                        {member.email}
                                    </Text>
                                </View>
                                {currentUserRoles.includes("Leader") &&
                                    member.firebase_uid !== user?.uid && (
                                        <Menu>
                                            <MenuTrigger>
                                                <Text
                                                    className='text-black dark:text-white p-4'
                                                    style={{
                                                        fontSize:
                                                            fontSize["2xl"],
                                                    }}>
                                                    ⋮
                                                </Text>
                                            </MenuTrigger>
                                            <MenuOptions
                                                customStyles={{
                                                    optionsContainer: {
                                                        borderRadius: 10,
                                                        paddingVertical: 4,
                                                        backgroundColor:
                                                            systemScheme ===
                                                            "dark"
                                                                ? "#333"
                                                                : "#fff",
                                                    },
                                                }}>
                                                <MenuOption
                                                    onSelect={() =>
                                                        handleRemoveMember(
                                                            activeBand?.id ||
                                                                "",
                                                            member.firebase_uid
                                                        )
                                                    }
                                                    text='Remove member'
                                                    customStyles={{
                                                        optionText: {
                                                            color:
                                                                systemScheme ===
                                                                "dark"
                                                                    ? "#fff"
                                                                    : "#333",
                                                            paddingVertical: 8,
                                                            fontSize:
                                                                fontSize.base,
                                                        },
                                                    }}
                                                />
                                                <MenuOption
                                                    onSelect={() =>
                                                        handleMakeLeader(
                                                            member.firebase_uid
                                                        )
                                                    }
                                                    text='Make leader'
                                                    customStyles={{
                                                        optionText: {
                                                            color:
                                                                systemScheme ===
                                                                "dark"
                                                                    ? "#fff"
                                                                    : "#333",
                                                            paddingVertical: 8,
                                                            fontSize:
                                                                fontSize.base,
                                                        },
                                                    }}
                                                />
                                            </MenuOptions>
                                        </Menu>
                                    )}
                            </Card>
                        ))}
                    </ScrollView>
                </>
            )}
        </PageContainer>
    );
}
