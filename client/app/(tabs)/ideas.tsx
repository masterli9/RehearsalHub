import Card from "@/components/Card";
import ErrorText from "@/components/ErrorText";
import NoBand from "@/components/NoBand";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StyledButton from "@/components/StyledButton";
import StyledModal from "@/components/StyledModal";
import StyledTextInput from "@/components/StyledTextInput";
import { SwitchBandModal } from "@/components/SwitchBandModal";
import StyledDropdown from "@/components/StyledDropdown";
import SwitchTabs from "@/components/SwitchTabs";
import apiUrl from "@/config";
import { usePlayer } from "@/context/AudioPlayerContext";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";
import { Formik } from "formik";
import { Clock, Hash, Mic, Music4, Pause, Play, Square, Star } from "lucide-react-native";
import { Metronome } from "@/components/Metronome";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
    Image,
    RefreshControl,
    Platform
} from "react-native";
import {
    Menu,
    MenuOption,
    MenuOptions,
    MenuTrigger,
} from "react-native-popup-menu";
import * as yup from "yup";

const IdeaCard = ({ idea, toggleFavorite, colorScheme, fontSize, apiUrl, getIdeas }: any) => {
    const router = useRouter();
    const { play, pause, current, isPlaying } = usePlayer();
    const isCurrent =
        current?.song_id === idea.idea_id && current?.type === "idea";

    const handlePlay = () => {
        if (!idea.audiourl) return;
        if (isCurrent && isPlaying) {
            pause();
        } else {
            play({
                song_id: idea.idea_id,
                title: idea.title,
                url: idea.audiourl,
                type: "idea",
            });
        }
    };

    const formatDuration = (interval: any) => {
        if (!interval) return "0:00";
        if (typeof interval === "object") {
            const minutes = interval.minutes || 0;
            const seconds = interval.seconds || 0;
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        }
        if (typeof interval === "string") {
            const parts = interval.split(":");
            if (parts.length >= 2) {
                const seconds = parts.pop();
                const minutes = parts.pop();
                return `${parseInt(minutes || "0", 10)}:${seconds}`;
            }
            return interval;
        }
        return "0:00";
    };

    const deleteIdea = (idea_id: number) => {
        Alert.alert("Delete idea", "Are you sure you want to delete this idea?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        await fetch(`${apiUrl}/api/ideas/${idea_id}`, { method: 'DELETE' });
                        getIdeas();
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        ]);
    };

    return (
        <Card className='w-full flex-col mb-3 p-4'>
            <View className="flex-row justify-between items-start w-full">
                <View className="flex-row items-center flex-1 pr-2">
                    <Image source={{ uri: idea.photourl }} className='w-10 h-10 rounded-full mr-3' style={{ width: fontSize["2xl"] * 1.8, height: fontSize["2xl"] * 1.8 }} />
                    <View className="flex-col flex-1">
                        <Text className="text-black dark:text-white font-bold mb-1" style={{ fontSize: fontSize.xl }} numberOfLines={1}>
                            {idea.title}
                        </Text>
                        <Text className="text-silverText" style={{ fontSize: fontSize.sm }}>
                            {idea.username} • {new Date(idea.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center gap-1">
                    <Pressable onPress={() => toggleFavorite(idea.idea_id, idea.is_favorite)} className="p-2">
                        <Star
                            size={Math.min(fontSize["2xl"], 24)}
                            color={idea.is_favorite ? "#FFD700" : (colorScheme === 'dark' ? '#555' : '#ccc')}
                            fill={idea.is_favorite ? "#FFD700" : "transparent"}
                        />
                    </Pressable>
                    <Menu>
                        <MenuTrigger>
                            <Text className='text-silverText px-2 py-1' style={{ fontSize: fontSize["2xl"] }}>⋮</Text>
                        </MenuTrigger>
                        <MenuOptions
                            customStyles={{
                                optionsContainer: {
                                    borderRadius: 10,
                                    paddingVertical: 4,
                                    backgroundColor: colorScheme === "dark" ? "#333" : "#fff",
                                },
                            }}>
                            <MenuOption
                                onSelect={() => router.push(`/idea/${idea.idea_id}`)}
                                text="Edit / Open"
                                customStyles={{
                                    optionText: {
                                        color: colorScheme === 'dark' ? '#fff' : '#000',
                                        fontSize: fontSize.base,
                                        padding: 10
                                    }
                                }}
                            />
                            <MenuOption
                                onSelect={() => deleteIdea(idea.idea_id)}
                                text="Delete idea"
                                customStyles={{
                                    optionText: {
                                        color: 'red',
                                        fontSize: fontSize.base,
                                        padding: 10
                                    }
                                }}
                            />
                        </MenuOptions>
                    </Menu>
                </View>
            </View>

            {idea.description ? (
                <Text className="text-silverText mt-3" style={{ fontSize: fontSize.base }} numberOfLines={2}>
                    {idea.description}
                </Text>
            ) : null}

            <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-accent-light dark:border-accent-dark w-full">
                <View className="flex-row items-center gap-3 flex-1">
                    <View className="flex-row items-center gap-1">
                        <Clock color="#A1A1A1" size={14} />
                        <Text className="text-silverText" style={{ fontSize: fontSize.xs }}>
                            {idea.idea_type === 'text' ? 'TEXT' : formatDuration(idea.length)}
                        </Text>
                    </View>
                    {idea.bpm && (
                        <View className="flex-row items-center gap-1">
                            <Hash color="#A1A1A1" size={14} />
                            <Text className="text-silverText" style={{ fontSize: fontSize.xs }}>{idea.bpm}</Text>
                        </View>
                    )}
                    {idea.key && (
                        <View className="flex-row items-center gap-1">
                            <Music4 color="#A1A1A1" size={14} />
                            <Text className="text-silverText" style={{ fontSize: fontSize.xs }}>{idea.key}</Text>
                        </View>
                    )}
                </View>

                {idea.idea_type !== 'text' && (
                    <Pressable
                        onPress={handlePlay}
                        disabled={!idea.audiourl}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isCurrent && isPlaying ? 'bg-darkRed' : 'bg-black dark:bg-white'}`}>
                        {isCurrent && isPlaying ? (
                            <Pause color="#fff" size={18} />
                        ) : (
                            <Play color={colorScheme === 'dark' ? '#000' : '#fff'} size={18} style={{ opacity: idea.audiourl ? 1 : 0.5, marginLeft: 2 }} />
                        )}
                    </Pressable>
                )}
            </View>
        </Card>
    );
};

const IdeasTab = () => {
    const router = useRouter();
    const { bands, bandsLoading, activeBand } = useBand();
    const { user } = useAuth();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();

    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("Favorites");
    const [ideas, setIdeas] = useState<any[]>([]);

    const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
    const [typeDropdownValue, setTypeDropdownValue] = useState('audio');
    const [typeDropdownItems, setTypeDropdownItems] = useState([
        { label: 'Audio Idea', value: 'audio' },
        { label: 'Text Idea', value: 'text' }
    ]);
    const isIdeaTypeText = typeDropdownValue === 'text';

    const [metronomeBpm, setMetronomeBpm] = useState(120);
    const [metronomePlaying, setMetronomePlaying] = useState(false);


    const [allIdeas, setAllIdeas] = useState<any[]>([]);
    const [myIdeas, setMyIdeas] = useState<any[]>([]);
    const [favoriteIdeas, setFavoriteIdeas] = useState<any[]>([]);
    const [visibleIdeas, setVisibleIdeas] = useState<any[]>([]);
    const [activeIdeasCount, setActiveIdeasCount] = useState<number>(0);
    const [ideasLoading, setIdeasLoading] = useState(false);
    const [addIdeaModalVisible, setAddIdeaModalVisible] = useState(false);

    const [refreshing, setRefreshing] = useState(false);

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

    const getIdeas = useCallback(async () => {
        setIdeasLoading(true);
        try {
            const allIdeasResponse = await fetch(`${apiUrl}/api/ideas/get?band_id=${activeBand?.id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await allIdeasResponse.json();
            if (!allIdeasResponse.ok || !Array.isArray(data)) {
                setIdeas([]);
            } else {
                setIdeas(data);
            }
        } catch (error) {
            console.error("Error getting ideas: ", error);
            setIdeas([]);
        } finally {
            setIdeasLoading(false);
        }
    }, [activeBand?.id, apiUrl]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await getIdeas();
        setRefreshing(false);
    }, [getIdeas]);

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
        const createResp = await fetch(`${apiUrl}/api/ideas/upload-url`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, contentType, bandId }),
        });

        if (!createResp.ok) throw new Error("Failed to get upload url");

        const { uploadUrl, path } = await createResp.json();

        const uploadTask = FileSystem.createUploadTask(
            uploadUrl,
            localUri,
            {
                httpMethod: "PUT",
                uploadType: 0 as any,
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

        const result = await uploadTask.uploadAsync();
        console.log("upload result", result?.status);

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

    useEffect(() => {
        if (!addIdeaModalVisible) {
            setMetronomePlaying(false);
        }
    }, [addIdeaModalVisible]);

    useEffect(() => {
        if (activeBand?.id) {
            getIdeas();
        } else {
            setIdeas([]);
            setFavoriteIdeas([]);
        }
    }, [activeBand?.id, getIdeas]);

    useEffect(() => {
        const sourceIdeas = Array.isArray(ideas) ? ideas : [];
        setAllIdeas(sourceIdeas);

        const mine = sourceIdeas.filter((idea) => idea.username === user?.username);
        setMyIdeas(mine);

        const favs = sourceIdeas.filter((idea) => idea.is_favorite);
        setFavoriteIdeas(favs);
    }, [ideas, user?.username]);

    const ideasLimitByTab = useMemo<Record<string, number>>(() => ({
        Favorites: 20,
        "My Ideas": 50,
        "All Ideas": 200,
    }), []);

    useEffect(() => {
        const limit = ideasLimitByTab[activeTab] ?? Infinity;
        const activeList =
            activeTab === "All Ideas"
                ? allIdeas
                : activeTab === "My Ideas"
                    ? myIdeas
                    : activeTab === "Favorites"
                        ? favoriteIdeas
                        : [];

        setActiveIdeasCount(activeList.length);
        setVisibleIdeas(activeList.slice(0, limit));
    }, [activeTab, allIdeas, myIdeas, favoriteIdeas]);

    const toggleFavorite = async (idea_id: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        setIdeas(prev => prev.map(i => i.idea_id === idea_id ? { ...i, is_favorite: newStatus } : i));
        setVisibleIdeas(prev => prev.map(i => i.idea_id === idea_id ? { ...i, is_favorite: newStatus } : i));

        try {
            await fetch(`${apiUrl}/api/ideas/${idea_id}/favorite`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_favorite: newStatus })
            });
        } catch (e) {
            console.error(e);
            setIdeas(prev => prev.map(i => i.idea_id === idea_id ? { ...i, is_favorite: currentStatus } : i));
            setVisibleIdeas(prev => prev.map(i => i.idea_id === idea_id ? { ...i, is_favorite: currentStatus } : i));
        }
    };

    return (
        <PageContainer noBandState={!bandsLoading && bands.length === 0}>
            <StyledModal
                wide={true}
                visible={addIdeaModalVisible}
                onClose={() => setAddIdeaModalVisible(false)}
                title='New MusIdea'
                subtitle='Capture your musical inspiration'>
                <View className="mb-4 z-50">
                    <StyledDropdown
                        open={typeDropdownOpen}
                        value={typeDropdownValue}
                        items={typeDropdownItems}
                        setOpen={setTypeDropdownOpen}
                        setValue={setTypeDropdownValue}
                        setItems={setTypeDropdownItems}
                        placeholder="Select type"
                        listMode="SCROLLVIEW"
                    />
                </View>
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
                            if (!activeBand) return;

                            let path = null;
                            if (!isIdeaTypeText) {
                                if (!audioURI) {
                                    Alert.alert("Error", "No audio file selected");
                                    return;
                                }
                                const uploadRes = await uploadFileToSignedUrl({
                                    localUri: audioURI,
                                    filename: `idea_${Date.now()}.m4a`,
                                    contentType: "audio/m4a",
                                    bandId: activeBand.id,
                                    onProgress: () => { },
                                });
                                path = uploadRes.path;
                            }

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
                                    length: isIdeaTypeText ? null : recordedDuration,
                                    idea_type: isIdeaTypeText ? 'text' : 'audio',
                                    bpm: isIdeaTypeText ? null : metronomeBpm,
                                }),
                            });

                            if (!response.ok) {
                                throw new Error("Failed to create idea");
                            }

                            const newIdea = await response.json();

                            setAddIdeaModalVisible(false);
                            getIdeas();

                            // Send user to edit properties directly
                            router.push(`/idea/${newIdea.idea_id}`);
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

                            {!isIdeaTypeText && (
                                <>
                                    <View className="mb-4 mt-2">
                                        <Metronome
                                            bpm={metronomeBpm}
                                            setBpm={setMetronomeBpm}
                                            isPlaying={metronomePlaying}
                                            setIsPlaying={setMetronomePlaying}
                                        />
                                    </View>
                                    <View className="flex-col items-center">
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
                                                className='text-black dark:text-white mb-4'
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
                                                    className='text-black dark:text-white mb-4'
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
                                    </View>
                                </>
                            )}

                            <StyledButton
                                title={isIdeaTypeText ? 'Start editing' : 'Submit'}
                                onPress={handleSubmit}
                                disabled={!isIdeaTypeText && !audioURI}
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
                            tabs={["Favorites", "My Ideas", "All Ideas"]}
                        />
                    </View>
                    <View className='flex-col justify-center items-center gap-3 w-full border-b border-accent-light dark:border-accent-dark w-full px-5 py-3'>
                        <View className='flex-row justify-between items-center w-full'>
                            <Text
                                className='text-silverText'
                                style={{ fontSize: fontSize.base }}>
                                {activeIdeasCount} ideas
                            </Text>
                            <StyledButton
                                onPress={() => setAddIdeaModalVisible(true)}
                                title='+  New Idea'
                            />
                        </View>
                    </View>
                    {ideasLoading && !refreshing ? (
                        <View className='flex-1 w-full justify-center items-center py-8'>
                            <ActivityIndicator
                                size='large'
                                color='#2B7FFF'
                            />
                            <Text
                                className='text-silverText mt-4'
                                style={{ fontSize: fontSize.base }}>
                                Loading ideas...
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            className='flex-col px-3 w-full mt-3 gap-2'
                            contentContainerStyle={{
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={colorScheme === "dark" ? "#ffffff" : "#000000"}
                                    colors={["#2B7FFF"]}
                                    progressViewOffset={Platform.OS === 'android' ? 50 : 0}
                                />
                            }>
                            {visibleIdeas.length > 0 ? (
                                visibleIdeas.map((idea) => (
                                    <IdeaCard key={idea.idea_id} idea={idea} toggleFavorite={toggleFavorite} colorScheme={colorScheme} fontSize={fontSize} apiUrl={apiUrl} getIdeas={getIdeas} />
                                ))
                            ) : (
                                <Text className="text-silverText" style={{ fontSize: fontSize.base }}>
                                    {activeTab === "Favorites"
                                        ? "No favorite ideas"
                                        : "No ideas yet"}
                                </Text>
                            )}
                        </ScrollView>
                    )}
                </>
            )}
        </PageContainer>
    );
};

export default IdeasTab;
