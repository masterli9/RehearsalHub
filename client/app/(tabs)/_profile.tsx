import StyledDropdown from "@/components/StyledDropdown";
import StyledModal from "@/components/StyledModal";
import StyledTextInput from "@/components/StyledTextInput";
import apiUrl from "@/config";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { useTheme } from "@/context/ThemeContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Formik } from "formik";
import { LogOut, SquarePen } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Yup from "yup";

const EditSchema = Yup.object().shape({
    username: Yup.string()
        .matches(
            /^[a-zA-Z0-9_.-]{3,20}$/,
            "Username can use letters, numbers, ., _ and -"
        )
        .required("Username is required"),
});

const Profile = () => {
    const { activeBand, bands, bandsLoading, switchBand } = useBand();
    const { user, logout, idToken, updateUser } = useAuth();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();
    const { themePreference, setThemePreference } = useTheme();

    const [editVisible, setEditVisible] = useState(false);
    const [uploading, setUploading] = useState(false);

    const options = [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
        { label: "System", value: "system" },
    ] as const;

    const [openSwitch, setOpenSwitch] = useState(false);
    const [valueSwitch, setValueSwitch] = useState("");
    const [itemsSwitch, setItemsSwitch] = useState<any[]>(
        bands.map((band) => ({
            label: band.name,
            value: band.id,
        })) || []
    );

    useEffect(() => {
        if (activeBand) {
            setValueSwitch(activeBand.id);
        }
        if (bands) {
            setItemsSwitch(
                bands.map((band) => ({
                    label: band.name,
                    value: band.id,
                }))
            );
        }
    }, [bands]);

    const handleBandSwitch = (bandId: string | null) => {
        if (!bandId || bandId === activeBand?.id) {
            return;
        }

        const switchedBand = switchBand(bandId);
        setOpenSwitch(false);
        if (switchedBand) {
            Alert.alert("Success", "Band switched to " + switchedBand.name);
        }
    };

    if (!user) return null;

    const pickAndUploadAvatar = async (onSuccess: (url: string) => void) => {
        try {
            setUploading(true);

            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(
                    "Permission needed",
                    "We need photo library access."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsEditing: false,
            });

            if (result.canceled) {
                return;
            }

            const asset = result.assets[0];
            if (!asset.uri) {
                Alert.alert("Error", "Image not found.");
                return;
            }

            const w = asset.width ?? 512;
            const h = asset.height ?? 512;
            const side = Math.min(w, h);

            const manip = await ImageManipulator.manipulateAsync(
                asset.uri,
                [
                    {
                        crop: {
                            originX: (w - side) / 2,
                            originY: (h - side) / 2,
                            width: side,
                            height: side,
                        },
                    },
                    { resize: { width: 512, height: 512 } },
                ],
                { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
            );

            // 1) ask backend for signed URL
            const filename = `avatar_${user.uid}_${Date.now()}.jpg`;

            const signedResp = await fetch(
                `${apiUrl}/api/users/avatar-upload-url`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        filename,
                        contentType: "image/jpeg",
                        uid: user.uid,
                    }),
                }
            );

            const signedData = await signedResp.json();
            if (!signedResp.ok)
                throw new Error(
                    signedData.error || "Failed to create upload URL."
                );

            const { uploadUrl, path } = signedData;

            // 2) upload to storage
            const blob = await (await fetch(manip.uri)).blob();

            const putResp = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": "image/jpeg" },
                body: blob,
            });

            if (!putResp.ok) throw new Error("Upload failed.");

            // 3) Finalize upload by making file public and getting URL
            const finalizeResp = await fetch(
                `${apiUrl}/api/users/finalize-avatar-upload`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({ path }),
                }
            );

            const finalizeData = await finalizeResp.json();
            if (!finalizeResp.ok) {
                throw new Error(
                    finalizeData.error || "Failed to finalize upload."
                );
            }

            onSuccess(finalizeData.publicUrl);
        } catch (err: any) {
            Alert.alert("Upload Error", "error uploading your image");
            throw new Error(err?.message);
        } finally {
            setUploading(false);
        }
    };

    const saveProfile = async (values: {
        username: string;
        photoURL: string | null;
    }) => {
        try {
            const resp = await fetch(`${apiUrl}/api/users/me`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ ...values, uid: user.uid }),
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error ?? "Failed to save.");
            }

            const updatedUser = await resp.json();

            updateUser({
                username: updatedUser.username,
                photoURL: updatedUser.photourl,
            });

            Alert.alert("Saved", "Profile updated.");
            setEditVisible(false);
        } catch (err: any) {
            Alert.alert(
                "Error",
                err?.message === "USERNAME_TAKEN"
                    ? "This username is already taken"
                    : "Failed to save."
            );
        }
    };

    return (
        <SafeAreaView className='flex-1'>
            <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark mt-4 w-full px-5 py-2'>
                <View className='flex-col items-start justify-center'>
                    <Text
                        className='text-black dark:text-white font-bold my-1'
                        style={{ fontSize: fontSize["2xl"] }}
                    >
                        Profile
                    </Text>
                    <Text
                        className='text-silverText'
                        style={{ fontSize: fontSize.base }}
                    >
                        Your personal settings
                    </Text>
                </View>
            </View>

            <View className='flex-1 items-center my-5 px-5'>
                <View className='flex-col bg-darkWhite dark:bg-darkGray rounded-xl w-full'>
                    <View className='flex-row items-center px-3 gap-3 border-b border-accent-light dark:border-accent-dark py-3'>
                        <Image
                            source={{ uri: user.photoURL || "" }}
                            className='w-12 h-12 rounded-full'
                        />
                        <View>
                            <Text
                                className='text-black dark:text-white font-bold'
                                style={{ fontSize: fontSize["2xl"] }}
                            >
                                {user.username}
                            </Text>
                            <Text
                                className='text-silverText'
                                style={{ fontSize: fontSize.base }}
                            >
                                {user.email}
                            </Text>
                        </View>
                    </View>

                    <Pressable
                        onPress={() => setEditVisible(true)}
                        className='px-3 py-5 flex-row items-center gap-3 w-full border-b border-accent-light dark:border-accent-dark'
                    >
                        <SquarePen
                            size={Math.min(fontSize["3xl"], 20)}
                            color={colorScheme === "dark" ? "#fff" : "#000"}
                        />
                        <Text
                            className='text-black dark:text-white'
                            style={{ fontSize: fontSize.base }}
                        >
                            Edit profile
                        </Text>
                    </Pressable>

                    <Pressable
                        className='px-3 py-5 flex-row items-center gap-3 w-full'
                        onPress={() => logout()}
                    >
                        <LogOut
                            size={Math.min(fontSize["3xl"], 20)}
                            color={colorScheme === "dark" ? "#fff" : "#000"}
                        />
                        <Text
                            className='text-black dark:text-white'
                            style={{ fontSize: fontSize.base }}
                        >
                            Log Out
                        </Text>
                    </Pressable>
                </View>

                <View className='w-full mt-4'>
                    <Text
                        className='font-bold text-black dark:text-white mb-3'
                        style={{ fontSize: fontSize.xl }}
                    >
                        Appearance
                    </Text>
                    <View className='flex-row p-3 rounded-2xl border border-accent-light dark:border-accent-dark items-center justify-between'>
                        <Text
                            className='text-black dark:text-white'
                            style={{ fontSize: fontSize.lg }}
                        >
                            Color theme
                        </Text>
                        <View className='flex-row gap-2 items-center'>
                            {options.map((opt) => (
                                <Pressable
                                    key={opt.value}
                                    onPress={() =>
                                        setThemePreference(opt.value)
                                    }
                                    className={`flex-row py-2 px-3 rounded-xl ${
                                        themePreference ===
                                        opt.value.toLowerCase()
                                            ? "bg-accent-dark"
                                            : "bg-transparent"
                                    }`}
                                >
                                    <Text
                                        className={`font-medium ${
                                            themePreference ===
                                            opt.value.toLowerCase()
                                                ? "text-white"
                                                : "text-black dark:text-silverText"
                                        }`}
                                        style={{ fontSize: fontSize.base }}
                                    >
                                        {opt.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
                <View className='w-full mt-4'>
                    <Text
                        className='font-bold text-black dark:text-white mb-3'
                        style={{ fontSize: fontSize.xl }}
                    >
                        Switch band context
                    </Text>
                    <StyledDropdown
                        items={itemsSwitch}
                        value={valueSwitch}
                        setValue={setValueSwitch}
                        open={openSwitch}
                        setOpen={setOpenSwitch}
                        multiple={false}
                        onChangeValue={handleBandSwitch}
                    />
                </View>
            </View>

            <StyledModal
                visible={editVisible}
                onClose={() => setEditVisible(false)}
                title='Edit Profile'
                subtitle='Update your username or profile photo'
            >
                <Formik
                    initialValues={{
                        username: user.username ?? "",
                        photoURL: user.photoURL ?? "",
                    }}
                    validationSchema={EditSchema}
                    onSubmit={saveProfile}
                >
                    {({
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        values,
                        errors,
                        touched,
                        setFieldValue,
                    }) => (
                        <View className='w-full flex-col items-center'>
                            {/* Avatar preview */}
                            <Image
                                source={{ uri: values.photoURL || "" }}
                                className='w-24 h-24 rounded-full bg-gray-200 mt-2'
                            />

                            {/* Change photo */}
                            <Pressable
                                className='mt-2 mb-4 px-4 py-2 bg-accent-light dark:bg-accent-dark rounded-xl'
                                onPress={() =>
                                    pickAndUploadAvatar((url) =>
                                        setFieldValue("photoURL", url)
                                    )
                                }
                            >
                                {uploading ? (
                                    <ActivityIndicator color='#fff' />
                                ) : (
                                    <Text
                                        className='text-black dark:text-white'
                                        style={{ fontSize: fontSize.base }}
                                    >
                                        Change photo
                                    </Text>
                                )}
                            </Pressable>

                            {/* Username */}
                            <StyledTextInput
                                placeholder='Username'
                                value={values.username}
                                onChangeText={handleChange("username")}
                                onBlur={handleBlur("username")}
                                className='mt-3'
                            />
                            {touched.username && errors.username && (
                                <Text className='text-red-500 mt-1'>
                                    {errors.username}
                                </Text>
                            )}

                            {/* SAVE BUTTON */}
                            <Pressable
                                onPress={() => handleSubmit()}
                                className='mt-5 px-5 py-3 bg-accent-light dark:bg-accent-dark rounded-xl w-full items-center'
                            >
                                <Text
                                    className='text-black dark:text-white'
                                    style={{ fontSize: fontSize.base }}
                                >
                                    Save
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </Formik>
            </StyledModal>
        </SafeAreaView>
    );
};

export default Profile;
