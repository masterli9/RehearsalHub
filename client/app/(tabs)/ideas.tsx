import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    Pressable,
    Alert,
} from "react-native";
import PageContainer from "@/components/PageContainer";
import NoBand from "@/components/NoBand";
import { useBand } from "@/context/BandContext";
import { useAuth } from "@/context/AuthContext";
import { requestRecordingPermissionsAsync, useAudioPlayer } from "expo-audio";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { useColorScheme } from "@/hooks/use-color-scheme";
import ErrorText from "@/components/ErrorText";
import { useState, useEffect } from "react";
import {
    Menu,
    MenuOption,
    MenuTrigger,
    MenuOptions,
} from "react-native-popup-menu";
import SwitchTabs from "@/components/SwitchTabs";
import { SwitchBandModal } from "@/components/SwitchBandModal";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import { Clock, Hash, Music4, Mic, Play, Square } from "lucide-react-native";
import StyledButton from "@/components/StyledButton";
import StyledModal from "@/components/StyledModal";
import StyledTextInput from "@/components/StyledTextInput";
import {
    useAudioRecorder,
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorderState,
} from "expo-audio";
import apiUrl from "@/config";
import * as FileSystem from "expo-file-system/legacy";
import { Formik } from "formik";
import * as yup from "yup";

const ideas = () => {
    const { bands, bandsLoading, activeBand } = useBand();
    const { user } = useAuth();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();

    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("All Ideas");
    const [ideas, setIdeas] = useState<any[]>([]);
    const [ideasLoading, setIdeasLoading] = useState(false);
    const [addIdeaModalVisible, setAddIdeaModalVisible] = useState(false);

    const newIdeaSchema = yup.object().shape({
        title: yup
            .string()
            .max(255, "Title is too long")
            .required("Title is required"),
        description: yup.string().max(1000, "Description is too long"),
    });

    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder, 200);
    const [audioURI, setAudioURI] = useState<string | null>(null);
    const [recordedDuration, setRecordedDuration] = useState<number | null>(
        null
    );

    useEffect(() => {
        if (activeBand?.id) {
            getIdeas();
        } else {
            setIdeas([]);
        }
    }, [activeBand?.id]);

    const getIdeas = async () => {
        const response = await fetch(`${apiUrl}/api/ideas/get?band_id=${activeBand?.id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = await response.json();
        setIdeas(data);
    }

    const record = async () => {
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setRecordedDuration(null);
        setAudioURI(null);
    };
    const stopRecording = async () => {
        await audioRecorder.stop();
        setAudioURI(audioRecorder.uri);
        setRecordedDuration(recorderState.durationMillis);
    };

    const handleRecordButtonPress = async () => {
        const permissionStatus =
            await AudioModule.requestRecordingPermissionsAsync();
        if (!permissionStatus.granted) {
            Alert.alert("Permission to access microphone has been denied.");
        }
        setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: true,
        });

        if (recorderState.isRecording) {
            await stopRecording();
        } else {
            await record();
        }
    };
    async function uploadFileToSignedUrl({
        localUri,
        filename,
        contentType,
        bandId,
        onProgress,
    }: {
        localUri: string;
        filename: string;
        contentType: string;
        bandId: string;
        onProgress: (progress: number) => void;
    }) {
        // 1. Get the Signed URL (same as before)
        const createResp = await fetch(`${apiUrl}/api/ideas/upload-url`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, contentType, bandId }),
        });

        if (!createResp.ok) throw new Error("Failed to get upload url");

        const { uploadUrl, path } = await createResp.json();

        // 2. Create Upload Task
        // We use the direct integer 0 for BINARY_CONTENT to avoid type import issues.
        // 0 = BINARY_CONTENT, 1 = MULTIPART
        const uploadTask = FileSystem.createUploadTask(
            uploadUrl,
            localUri,
            {
                httpMethod: "PUT",
                uploadType: 0 as any, // 0 maps to BINARY_CONTENT. Cast 'as any' silences the strict type check if needed.
                headers: {
                    "Content-Type": contentType,
                },
            },
            (uploadProgress) => {
                const totalBytesSent = uploadProgress.totalBytesSent;
                const totalBytesExpectedToSend =
                    uploadProgress.totalBytesExpectedToSend;

                if (totalBytesExpectedToSend > 0) {
                    const percent =
                        (totalBytesSent / totalBytesExpectedToSend) * 100;
                    onProgress(Math.min(Math.round(percent), 95));
                }
            }
        );

        // 3. Start the upload
        const result = await uploadTask.uploadAsync();
        console.log("upload result", result?.status);

        // 4. Validate Result
        // Google Cloud Storage returns 200 or 201 on success
        if (result && result.status >= 200 && result.status < 300) {
            onProgress(100);
            console.log("upload successful", path);
            return { path };
        } else {
            throw new Error(
                `Upload failed. Cloud Storage Status: ${result?.status}`
            );
        }
    }

    const IdeaCard = ({ idea }: { idea: any }) => {
        return (
            <Card className='w-full flex-col'>
                <View className='flex-row justify-between items-center'>
                    <View className='flex-col'>
                        <Text
                            className='text-black dark:text-white font-bold my-1'
                            style={{ fontSize: fontSize.xl }}>
                            {idea.title}
                        </Text>
                        <Text
                            className='text-silverText'
                            style={{ fontSize: fontSize.base }}>
                            Username • {idea.created_at}
                        </Text>
                    </View>
                    <Menu>
                        <MenuTrigger>
                            <Text
                                className='text-black dark:text-white p-4'
                                style={{
                                    fontSize: fontSize["2xl"],
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
                                        colorScheme === "dark"
                                            ? "#333"
                                            : "#fff",
                                },
                            }}></MenuOptions>
                    </Menu>
                </View>
                <Text
                    className='text-silverText my-5'
                    style={{ fontSize: fontSize.base }}>
                    {idea.description}
                </Text>
                <View
                    className='flex-row gap-2 mt-5'
                    style={{ flexWrap: "wrap" }}>
                    <View className='flex-row items-center gap-1'>
                        <Clock
                            color={"#A1A1A1"}
                            size={Math.min(fontSize["2xl"], 20)}
                            style={{
                                marginRight: 2,
                                marginBottom: -2,
                            }}
                        />
                        <Text
                            className='text-silverText'
                            style={{
                                fontSize: fontSize.base,
                                alignItems: "center",
                            }}
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.3}>
                            0:22
                        </Text>
                    </View>
                    <View className='flex-row items-center gap-1'>
                        <Hash
                            color={"#A1A1A1"}
                            size={Math.min(fontSize["2xl"], 20)}
                            style={{
                                marginRight: 2,
                                marginBottom: -2,
                            }}
                        />
                        <Text
                            className='text-silverText'
                            style={{
                                fontSize: fontSize.base,
                                alignItems: "center",
                            }}
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.3}>
                            Am
                        </Text>
                    </View>
                    <View className='flex-row items-center gap-1'>
                        <Music4
                            color={"#A1A1A1"}
                            size={Math.min(fontSize["2xl"], 20)}
                            style={{
                                marginRight: 2,
                                marginBottom: -2,
                            }}
                        />
                        <Text
                            className='text-silverText'
                            style={{
                                fontSize: fontSize.base,
                                alignItems: "center",
                            }}
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.3}>
                            110 BPM
                        </Text>
                    </View>
                </View>
                <View className='flex-row w-full justify-center items-center mt-4'>
                    <Pressable>
                        <Play
                            color={colorScheme === "dark" ? "#fff" : "#0A0A0A"}
                            size={20}
                        />
                    </Pressable>
                </View>
            </Card>
        );
    };

    return (
        <PageContainer noBandState={!bandsLoading && bands.length === 0}>
            <StyledModal
                wide={true}
                visible={addIdeaModalVisible}
                onClose={() => setAddIdeaModalVisible(false)}
                title='Record a New MusIdea'
                subtitle='Capture your muscial inspiration'>
                <Formik
                    validationSchema={newIdeaSchema}
                    validateOnBlur={false}
                    validateOnChange={false}
                    initialValues={{
                        title: "",
                        description: "",
                    }}
                    onSubmit={async (values, { setSubmitting }) => {
                        try {
                            if (!audioURI || activeBand === null) {
                                Alert.alert("Error", "No audio file selected");
                                return;
                            }

                            const { path } = await uploadFileToSignedUrl({
                                localUri: audioURI,
                                filename: `idea_${Date.now()}.m4a`,
                                contentType: "audio/m4a",
                                bandId: activeBand.id,
                                onProgress: () => {},
                            });

                            const response = await fetch(`${apiUrl}/api/ideas/create`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    title: values.title,
                                    description: values.description,
                                    user_uid: user?.uid,
                                    band_id: activeBand.id,
                                    cloudurl: path,
                                    length: recordedDuration,
                                }),
                            });

                            if (!response.ok) {
                                throw new Error("Failed to create idea");
                            }

                            setAddIdeaModalVisible(false);
                            Alert.alert("Success", "Idea created successfully");
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "Failed to save idea");
                        } finally {
                            setSubmitting(false);
                        }
                    }}>
                    {({
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        values,
                        setFieldValue,
                        setFieldTouched,
                        errors,
                        touched,
                        submitCount,
                    }) => (
                        <>
                            <StyledTextInput
                                placeholder='Title'
                                value={values.title}
                                onChangeText={handleChange("title")}
                                onBlur={handleBlur("title")}
                                className='my-4'
                            />
                            {(touched.title || submitCount > 0) &&
                                errors.title && (
                                    <ErrorText>{errors.title}</ErrorText>
                                )}
                            <StyledTextInput
                                placeholder='Description'
                                value={values.description}
                                onChangeText={handleChange("description")}
                                onBlur={handleBlur("description")}
                                className='mb-4'
                            />
                            {(touched.description || submitCount > 0) &&
                                errors.description && (
                                    <ErrorText>{errors.description}</ErrorText>
                                )}
                            <Pressable
                                className={`${recorderState.isRecording ? "bg-darkRed" : "bg-black dark:bg-white"} rounded-full p-5 my-4 active:bg-gray-200 active:scale-90`}
                                onPress={() => {
                                    handleRecordButtonPress();
                                }}>
                                {recorderState.isRecording ? (
                                    <Square color='white' size={30} />
                                ) : (
                                    <Mic
                                        color={
                                            colorScheme === "dark"
                                                ? "#0A0A0A"
                                                : "#fff"
                                        }
                                        size={30}
                                    />
                                )}
                            </Pressable>
                            {recorderState.isRecording ? (
                                <Text
                                    className='text-black dark:text-white'
                                    style={{ fontSize: fontSize.lg }}>
                                    {(() => {
                                        const totalSeconds = Math.floor(
                                            recorderState.durationMillis / 1000
                                        );
                                        const minutes = Math.floor(
                                            totalSeconds / 60
                                        );
                                        const seconds = totalSeconds % 60;
                                        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
                                    })()}
                                </Text>
                            ) : (
                                audioURI &&
                                recordedDuration && (
                                    <Text
                                        className='text-black dark:text-white'
                                        style={{ fontSize: fontSize.lg }}>
                                        {(() => {
                                            const totalSeconds = Math.floor(
                                                recordedDuration / 1000
                                            );
                                            const minutes = Math.floor(
                                                totalSeconds / 60
                                            );
                                            const seconds = totalSeconds % 60;
                                            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
                                        })()}
                                    </Text>
                                )
                            )}
                            <StyledButton
                                title='Submit'
                                onPress={handleSubmit}
                                disabled={!audioURI}
                                className='my-4'
                            />
                        </>
                    )}
                </Formik>
            </StyledModal>
            <SwitchBandModal
                onClose={() => setShowSwitchModal(false)}
                visible={showSwitchModal}
            />
            {bandsLoading ? (
                <View className='flex-1 w-full justify-center items-center'>
                    <ActivityIndicator size='large' color='#2B7FFF' />
                    <Text
                        className='text-silverText mt-4'
                        style={{ fontSize: fontSize.base }}>
                        Loading bands...
                    </Text>
                </View>
            ) : bands.length === 0 ? (
                <NoBand />
            ) : (
                <>
                    <PageHeader
                        title={`${activeBand?.name} MusIdeas`}
                        subtitle="Share and discover your band's musical ideas">
                        <MenuOption
                            onSelect={() => {
                                setShowSwitchModal(true);
                            }}
                            text='Switch band'
                            customStyles={{
                                optionText: {
                                    color:
                                        colorScheme === "dark"
                                            ? "#fff"
                                            : "#333",
                                    paddingVertical: 8,
                                    fontSize: fontSize.base,
                                },
                            }}
                        />
                    </PageHeader>
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark w-full px-4'>
                        <SwitchTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            tabs={["All Ideas", "My Ideas", "Recent"]}
                        />
                    </View>
                    <View className='flex-col justify-center items-center gap-3 w-full border-b border-accent-light dark:border-accent-dark w-full px-5 py-3'>
                        <View className='flex-row justify-between items-center w-full'>
                            <Text
                                className='text-silverText'
                                style={{ fontSize: fontSize.base }}>
                                8 ideas
                            </Text>
                            <StyledButton
                                onPress={() => setAddIdeaModalVisible(true)}
                                title='+  New Idea'
                            />
                        </View>
                    </View>
                    {activeTab === "All Ideas" ? (
                        <ScrollView
                            className='flex-col px-3 w-full mt-3 '
                            contentContainerStyle={{
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                            {ideas.map((idea) => (
                                <IdeaCard key={idea.idea_id} idea={idea} />
                            ))}
                        </ScrollView>
                    ) : activeTab === "My Ideas" ? (
                        <View className='flex-1 w-full justify-center items-center'>
                            <Text>My ideas</Text>
                        </View>
                    ) : (
                        <View className='flex-1 w-full justify-center items-center'>
                            <Text>Recent</Text>
                        </View>
                    )}
                </>
            )}
        </PageContainer>
    );
};

export default ideas;
