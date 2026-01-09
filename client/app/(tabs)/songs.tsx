import ErrorText from "@/components/ErrorText";
import NoBand from "@/components/NoBand";
import PageContainer from "@/components/PageContainer";
import StyledButton from "@/components/StyledButton";
import StyledDropdown from "@/components/StyledDropdown";
import StyledModal from "@/components/StyledModal";
import StyledTextInput from "@/components/StyledTextInput";
import SwitchTabs from "@/components/SwitchTabs";
import apiUrl from "@/config";
import { usePlayer } from "@/context/AudioPlayerContext";
import { useAuth } from "@/context/AuthContext";
import { BandSongTag, useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { createAudioPlayer } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Formik } from "formik";
import {
    ArrowUpDown,
    Calendar,
    Clock,
    EllipsisVertical,
    Hash,
    ListMusic,
    Pause,
    Play,
    SlidersHorizontal,
    X,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
    View,
} from "react-native";
import "react-native-gesture-handler";
import {
    Menu,
    MenuOption,
    MenuOptions,
    MenuTrigger,
} from "react-native-popup-menu";
import * as yup from "yup";

const songs = () => {
    const { play, pause, stop, resume, current, isPlaying } = usePlayer();
    const { user } = useAuth();
    const { bands, activeBand, bandsLoading } = useBand();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();
    const progressAnimationRef = useRef<null | number>(null);

    const [activeTab, setActiveTab] = useState<string>("Songs");
    const [newSongModalVisible, setNewSongModalVisible] =
        useState<boolean>(false);

    const [disableSubmitBtn, setDisableSubmitBtn] = useState<boolean>(false);

    const [songs, setSongs] = useState<any[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const [tags, setTags] = useState<any[]>([]);
    const [isAddingTag, setIsAddingTag] = useState<boolean>(false);

    // filter states
    const [sort, setSort] = useState("date_desc");
    const [filtersVisible, setFiltersVisible] = useState<boolean>(false);
    const [readyStatusSelected, setReadyStatusSelected] =
        useState<boolean>(false);
    const [draftStatusSelected, setDraftStatusSelected] =
        useState<boolean>(false);
    const [finishedStatusSelected, setFinishedStatusSelected] =
        useState<boolean>(false);
    const [selectedFilterTags, setSelectedFilterTags] = useState<number[]>([]);

    const [selectedFilterKeys, setSelectedFilterKeys] = useState<string[]>([]);

    const [searchText, setSearchText] = useState("");

    const isInitialMount = useRef(true);

    // This useEffect debounces the search input.
    // It waits for 300ms after the user stops typing before triggering a search.
    useEffect(() => {
        // Don't run on initial mount. The initial load is handled by the `activeBand` effect.
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const handler = setTimeout(() => {
            runFilterAndSearch();
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchText]); // The effect runs only when searchText changes.

    const runFilterAndSearch = () => {
        const statuses = [
            readyStatusSelected ? "ready" : null,
            finishedStatusSelected ? "finished" : null,
            draftStatusSelected ? "draft" : null,
        ].filter(Boolean) as string[];

        fetchSongs({
            status: statuses,
            search: searchText,
            tags: selectedFilterTags,
            keys: selectedFilterKeys,
        });
    };

    const stopProgressAnimation = () => {
        if (progressAnimationRef.current) {
            clearInterval(progressAnimationRef.current);
            progressAnimationRef.current = null;
        }
    };

    const handleApplyFilters = () => {
        runFilterAndSearch();
        closeFiltersModal();
    };

    const fetchSongs = async (params?: {
        status?: string[];
        tags?: number[];
        search?: string;
        keys?: string[];
    }) => {
        if (!activeBand?.id) {
            setSongs([]);
            return;
        }
        try {
            let query = `${apiUrl}/api/songs?bandId=${activeBand.id}`;

            if (params) {
                if (
                    params.status &&
                    Array.isArray(params.status) &&
                    params.status.length > 0
                ) {
                    for (const s of params.status) {
                        query += `&status=${encodeURIComponent(s)}`;
                    }
                }
                if (
                    params.tags &&
                    Array.isArray(params.tags) &&
                    params.tags.length > 0
                ) {
                    for (const t of params.tags) {
                        query += `&tags=${encodeURIComponent(t)}`;
                    }
                }
                if (
                    params.keys &&
                    Array.isArray(params.keys) &&
                    params.keys.length > 0
                ) {
                    for (const k of params.keys) {
                        query += `&songKey=${encodeURIComponent(k)}`;
                    }
                }
                if (params.search) {
                    query += `&search=${encodeURIComponent(params.search)}`;
                }
            }

            const response = await fetch(query, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Error fetching songs, status: ${response.status}`
                );
            }

            const data = await response.json();
            setSongs(data);
        } catch (error) {
            console.error("Error fetching songs:", error);
            setSongs([]);
        }
    };

    const sortedSongs = useMemo(() => {
        if (!Array.isArray(songs)) return [];
        const newSongs = [...songs]; // Create a shallow copy to sort

        switch (sort) {
            case "alphabetical_asc": // A-Z
                return newSongs.sort((a, b) => a.title.localeCompare(b.title));
            case "alphabetical_desc": // Z-A
                return newSongs.sort((a, b) => b.title.localeCompare(a.title));
            case "date_asc": // Oldest to newest
                return newSongs.sort(
                    (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()
                );
            case "date_desc": // Newest to oldest
            default:
                return newSongs.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );
        }
    }, [songs, sort]);

    const fetchTags = async () => {
        try {
            const response = await fetch(
                `${apiUrl}/api/songs/tags/${activeBand?.id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!response.ok) {
                throw new Error(
                    `Error fetching tags, status: ${response.status}`
                );
            }
            const data = await response.json();
            setTags(data);
        } catch (error) {
            console.error("Error setting tags:", error);
        }
    };

    useEffect(() => {
        // When the active band changes, fetch all songs for that band.
        // Filtering is applied manually via the search and filter controls.
        if (activeBand?.id) {
            runFilterAndSearch(); // This will now be the only initial trigger
            fetchTags();
        }
    }, [activeBand?.id]);

    useEffect(() => {
        return () => {
            stopProgressAnimation();
        };
    }, []);

    type NewSongFormValues = {
        title: string;
        bpm: string;
        songKey: string;
        length: string;
        description: string;
        status: string;
        tags: BandSongTag[];
        file: any;
    };
    type addTagFormValues = {
        name: string;
        color: string;
    };

    const SongCard = ({
        songId,
        audioUrl,
        songName,
        status,
        length,
        songKey,
        dateAdded,
        description,
        songTags,
    }: {
        songId: number;
        audioUrl: string;
        songName: string;
        status: "ready" | "draft" | "finished";
        length: string;
        songKey: string;
        dateAdded: string;
        description: string;
        songTags: any[];
    }) => {
        const formatInterval = (interval: any) => {
            if (!interval || typeof interval !== "object") {
                return interval || "N/A";
            }
            const minutes = interval.minutes || 0;
            const seconds = interval.seconds || 0;
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        };

        const formatDate = (dateString: string) => {
            if (!dateString) return "N/A";
            return new Date(dateString).toLocaleDateString();
        };

        const handlePlay = () => {
            if (!audioUrl) {
                Alert.alert("Error", "No audio file available for this song");
                return;
            }
            play({
                song_id: songId,
                title: songName,
                url: audioUrl,
                type: "song",
            });
        };
        const isCurrentSong = current?.song_id === songId;
        const showPause = isCurrentSong && isPlaying;
        return (
            <View className='bg-boxBackground-light dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark rounded-2xl p-5 w-full mb-3'>
                <View
                    className='flex-row justify-between items-center'
                    style={{ flexWrap: "wrap" }}
                >
                    <View
                        className='flex-col'
                        style={{ flexShrink: 1, flex: 1, minWidth: 0 }}
                    >
                        <View
                            className='flex-row items-center gap-2'
                            style={{ flexWrap: "wrap" }}
                        >
                            <Text
                                className='font-bold text-black dark:text-white'
                                style={{ fontSize: fontSize.xl }}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.3}
                            >
                                {songName}
                            </Text>
                            <Text
                                className={`${status === "ready" ? "text-green bg-transparentGreen" : status === "draft" ? "text-violet bg-transparentViolet" : status === "finished" && "text-blue bg-transparentBlue"} my-1 px-3 py-1 rounded-xl mr-2`}
                                style={{ fontSize: fontSize.base }}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.3}
                            >
                                {status}
                            </Text>
                        </View>
                        <View
                            className='flex-row gap-2'
                            style={{ flexWrap: "wrap" }}
                        >
                            <View className='flex-row items-center gap-1'>
                                <Clock
                                    color={"#A1A1A1"}
                                    size={Math.min(fontSize["2xl"], 20)}
                                    style={{ marginRight: 2, marginBottom: -2 }}
                                />
                                <Text
                                    className='text-silverText'
                                    style={{
                                        fontSize: fontSize.base,
                                        alignItems: "center",
                                    }}
                                    numberOfLines={1}
                                    maxFontSizeMultiplier={1.3}
                                >
                                    {formatInterval(length)}
                                </Text>
                            </View>
                            <View className='flex-row items-center gap-1'>
                                <Hash
                                    color={"#A1A1A1"}
                                    size={Math.min(fontSize["2xl"], 20)}
                                    style={{ marginRight: 2, marginBottom: -2 }}
                                />
                                <Text
                                    className='text-silverText'
                                    style={{
                                        fontSize: fontSize.base,
                                        alignItems: "center",
                                    }}
                                    numberOfLines={1}
                                    maxFontSizeMultiplier={1.3}
                                >
                                    {songKey || "N/A"}
                                </Text>
                            </View>
                            <View className='flex-row items-center gap-1'>
                                <Calendar
                                    color={"#A1A1A1"}
                                    size={Math.min(fontSize["2xl"], 20)}
                                    style={{ marginRight: 2, marginBottom: -2 }}
                                />
                                <Text
                                    className='text-silverText'
                                    style={{
                                        fontSize: fontSize.base,
                                        alignItems: "center",
                                    }}
                                    numberOfLines={1}
                                    maxFontSizeMultiplier={1.3}
                                >
                                    {formatDate(dateAdded)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View
                        className='flex-row gap-4 items-center'
                        style={{ flexShrink: 0 }}
                    >
                        <Pressable onPress={showPause ? pause : handlePlay}>
                            {showPause ? (
                                <Pause
                                    color={
                                        colorScheme === "dark"
                                            ? "white"
                                            : "black"
                                    }
                                    size={20}
                                />
                            ) : (
                                <Play
                                    color={
                                        colorScheme === "dark"
                                            ? "white"
                                            : "black"
                                    }
                                    size={20}
                                />
                            )}
                        </Pressable>
                        <Pressable>
                            <EllipsisVertical
                                color={
                                    colorScheme === "dark" ? "white" : "black"
                                }
                                size={20}
                            />
                        </Pressable>
                    </View>
                </View>
                {description && (
                    <Text
                        className='text-silverText my-2'
                        style={{ fontSize: fontSize.base }}
                        numberOfLines={3}
                        maxFontSizeMultiplier={1.3}
                    >
                        {description}
                    </Text>
                )}
                <View className='flex-row items-center gap-2 flex-wrap mt-2'>
                    {songTags.length > 0 &&
                        songTags.map((t) => (
                            <View
                                key={t.tag_id}
                                className='px-3 py-1 rounded-xl'
                                style={{
                                    backgroundColor: t.color,
                                }}
                            >
                                <Text
                                    className='text-white text-sm'
                                    // style={{ fontSize: fontSize.base }} // TODO: FIX ERROR
                                >
                                    {t.name}
                                </Text>
                            </View>
                        ))}
                </View>
            </View>
        );
    };

    const newSongSchema = yup.object().shape({
        title: yup
            .string()
            .trim()
            .min(2, "Title should be at least 2 characters")
            .max(255, "Title should be less than 255 characters")
            .required("Title is required"),
        bpm: yup
            .number()
            .nullable()
            .transform((value, originalValue) => {
                if (originalValue === "" || originalValue == null) return null;
                const num = Number(originalValue);
                return isNaN(num) ? null : num;
            })
            .min(1, "BPM should be at least 1")
            .max(32767, "BPM should be at most 32767"),
        description: yup
            .string()
            .nullable()
            .transform((value, originalValue) =>
                typeof originalValue === "string" && originalValue.trim() !== ""
                    ? originalValue.trim()
                    : null
            )
            .max(1000, "Description should be less than 1000 characters"),
        songKey: yup
            .string()
            .trim()
            .max(4, "Song key should be at most 4 characters")
            .required("Song key is required"),
        status: yup
            .string()
            .trim()
            .oneOf(["ready", "draft", "finished"])
            .required("Status is required"),
        tags: yup
            .array()
            .of(
                yup.object().shape({
                    name: yup.string().trim().required(),
                })
            )
            .nullable(),
        file: yup.object().shape({
            uri: yup.string().required("File is required"),
        }),
    });
    const addTagSchema = yup.object().shape({
        name: yup
            .string()
            .min(1, "Atleast one char.")
            .max(30, "Max length is 30 chars.")
            .required("name is required"),
        color: yup.string().required("color is required"),
    });
    // Dropdown states
    const [openStatus, setOpenStatus] = useState(false);
    const [valueStatus, setValueStatus] = useState(null);
    const [itemsStatus, setItemsStatus] = useState([
        { label: "Finished", value: "finished" },
        { label: "Ready", value: "ready" },
        { label: "Draft", value: "draft" },
    ]);
    const [openKey, setOpenKey] = useState(false);
    const [valueKey, setValueKey] = useState(null);
    const [itemsKey, setItemsKey] = useState([
        { label: "C", value: "C" },
        { label: "Cm", value: "Cm" },
        { label: "C#", value: "C#" },
        { label: "C#m", value: "C#m" },
        { label: "D", value: "D" },
        { label: "Dm", value: "Dm" },
        { label: "D#", value: "D#" },
        { label: "D#m", value: "D#m" },
        { label: "E", value: "E" },
        { label: "Em", value: "Em" },
        { label: "F", value: "F" },
        { label: "Fm", value: "Fm" },
        { label: "F#", value: "F#" },
        { label: "F#m", value: "F#m" },
        { label: "G", value: "G" },
        { label: "Gm", value: "Gm" },
        { label: "G#", value: "G#" },
        { label: "G#m", value: "G#m" },
        { label: "A", value: "A" },
        { label: "Am", value: "Am" },
        { label: "A#", value: "A#" },
        { label: "A#m", value: "A#m" },
        { label: "B", value: "B" },
        { label: "Bm", value: "Bm" },
    ]);

    // Sync dropdown states when modal opens/closes
    useEffect(() => {
        if (!newSongModalVisible) {
            // Reset dropdown states when modal closes
            setValueStatus(null);
            setValueKey(null);
            setOpenStatus(false);
            setOpenKey(false);
        }
    }, [newSongModalVisible]);

    // song file upload
    const formatFormikError = (err: unknown) => {
        if (!err) return null;
        if (typeof err === "string") return err;
        if (Array.isArray(err)) return err.filter(Boolean).join(", ");
        return null;
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
        const createResp = await fetch(`${apiUrl}/api/songs/upload-url`, {
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

        // 4. Validate Result
        // Google Cloud Storage returns 200 or 201 on success
        if (result && result.status >= 200 && result.status < 300) {
            onProgress(100);
            return { path };
        } else {
            throw new Error(
                `Upload failed. Cloud Storage Status: ${result?.status}`
            );
        }
    }

    const onPickBtnPress = async (
        setFieldValue: (field: string, value: any) => void
    ) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "audio/*",
            });
            if (!result.canceled) {
                const picked = result.assets[0];

                // Load audio file to get duration
                let audioPlayer: any = null;
                try {
                    audioPlayer = createAudioPlayer();
                    await audioPlayer.replace(picked.uri);

                    // Wait a bit for duration to be available
                    await new Promise((resolve) => setTimeout(resolve, 100));

                    // Get duration from the player (duration is in seconds)
                    const durationSeconds = audioPlayer.duration;

                    if (durationSeconds && durationSeconds > 0) {
                        // Convert seconds to PostgreSQL interval format (HH:MM:SS)
                        const totalSeconds = Math.floor(durationSeconds);
                        const hours = Math.floor(totalSeconds / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;

                        const durationString = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

                        // Store duration in the file object
                        setFieldValue("file", {
                            ...picked,
                            duration: durationString,
                            durationMillis: totalSeconds * 1000,
                        });
                    } else {
                        // If duration couldn't be loaded, just set the file without duration
                        setFieldValue("file", picked);
                    }
                } catch (audioError) {
                    console.error("Error loading audio duration:", audioError);
                    // If we can't get duration, still allow the file to be selected
                    setFieldValue("file", picked);
                } finally {
                    // Clean up the audio player if it exposes a delete/dispose/unload method.
                    if (
                        audioPlayer &&
                        typeof audioPlayer.delete === "function"
                    ) {
                        try {
                            audioPlayer.delete();
                        } catch (cleanupError) {
                            // Fails silently, this is just a best-effort cleanup
                        }
                    } else if (
                        audioPlayer &&
                        typeof audioPlayer.unloadAsync === "function"
                    ) {
                        try {
                            await audioPlayer.unloadAsync();
                        } catch (cleanupError) {
                            // Fails silently, this is just a best-effort cleanup
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "failed to choose file");
        } finally {
            // hide loader
        }
    };

    // Helper function to close modal and reset dropdown states
    const closeModalAndReset = () => {
        setNewSongModalVisible(false);
        setOpenKey(false);
        setUploadProgress(null);
        setIsUploading(false);
        setDisableSubmitBtn(false);
        setOpenStatus(false);
        setValueKey(null);
        setValueStatus(null);
        stopProgressAnimation();
    };

    const closeFiltersModal = () => {
        setFiltersVisible(false);
    };

    return (
        <PageContainer noBandState={!bandsLoading && bands.length === 0}>
            <StyledModal
                visible={newSongModalVisible}
                onClose={closeModalAndReset}
                canClose={!isUploading}
                wide={true}
                title='Create a song'
                subtitle="Add a new song to your band's repertoire and choose its tags and status"
            >
                <Formik<NewSongFormValues>
                    validationSchema={newSongSchema}
                    initialValues={{
                        title: "",
                        bpm: "",
                        status: "",
                        length: "",
                        songKey: "",
                        description: "",
                        tags: [],
                        file: null,
                    }}
                    enableReinitialize={false}
                    onSubmit={async (
                        values,
                        { setFieldError, setSubmitting }
                    ) => {
                        try {
                            if (!values.file) {
                                setFieldError(
                                    "file",
                                    "Please select an audio file"
                                );
                                return;
                            }

                            setIsUploading(true);
                            setUploadProgress(0);

                            const bandId = activeBand?.id || "";
                            const localUri = values.file.uri;
                            const filename =
                                values.file.name ||
                                localUri.split("/").pop() ||
                                "audio-file";
                            const contentType =
                                values.file.mimeType || "audio/mpeg";

                            // Convert bpm to number or null
                            let bpmValue: number | null = null;
                            if (values.bpm && values.bpm !== "") {
                                const bpmNum = Number(values.bpm);
                                if (
                                    !isNaN(bpmNum) &&
                                    bpmNum >= 1 &&
                                    bpmNum <= 32767
                                ) {
                                    bpmValue = Math.round(bpmNum);
                                }
                            }

                            // STEP 1: Upload file to cloud storage
                            const { path } = await uploadFileToSignedUrl({
                                localUri,
                                filename: filename.trim(),
                                contentType,
                                bandId: bandId,
                                onProgress: setUploadProgress,
                            });

                            // File upload is done (95%). Start "finalizing" animation.
                            progressAnimationRef.current = setInterval(() => {
                                setUploadProgress((prev) => {
                                    if (prev === null || prev >= 99) {
                                        stopProgressAnimation();
                                        return 99; // Cap at 99
                                    }
                                    return prev + 1;
                                });
                            }, 800);

                            // STEP 2: Save metadata to the database
                            const songResp = await fetch(
                                `${apiUrl}/api/songs/create`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        title: values.title.trim(),
                                        bandId: String(bandId).trim(),
                                        cloudurl: path,
                                        length:
                                            values.file.duration ||
                                            values.length ||
                                            null,
                                        bpm: bpmValue,
                                        notes:
                                            values.description?.trim() || null,
                                        songKey: values.songKey.trim(),
                                        status: values.status.trim(),
                                        tags: values.tags.map((t) => t.name),
                                    }),
                                }
                            );

                            stopProgressAnimation();

                            if (!songResp.ok) {
                                const err = await songResp
                                    .json()
                                    .catch(() => ({}));
                                throw new Error(
                                    err.error || "Saving song metadata failed"
                                );
                            }

                            setUploadProgress(100);

                            // Add a small delay so the user can see the 100% complete state
                            await new Promise((resolve) =>
                                setTimeout(resolve, 500)
                            );

                            closeModalAndReset();
                            fetchSongs(); // Refresh songs list
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Error", "failed to upload file");
                            setUploadProgress(null);
                            // Keep modal open on error so user can retry
                        } finally {
                            stopProgressAnimation();
                            setIsUploading(false);
                            setSubmitting(false);
                        }
                    }}
                    validateOnBlur={false}
                    validateOnChange={false}
                >
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
                            <View className='flex-col w-full gap-4 my-3'>
                                <StyledTextInput
                                    placeholder='Title'
                                    variant='rounded'
                                    value={values.title}
                                    onChangeText={handleChange("title")}
                                    onBlur={handleBlur("title")}
                                />
                                {touched.title && errors.title && (
                                    <View className='w-full flex-row justify-center'>
                                        <ErrorText>{errors.title}</ErrorText>
                                    </View>
                                )}
                                <StyledTextInput
                                    placeholder='BPM'
                                    variant='rounded'
                                    value={values.bpm}
                                    onChangeText={handleChange("bpm")}
                                    onBlur={handleBlur("bpm")}
                                    keyboardType='numeric'
                                />
                                {touched.bpm && errors.bpm && (
                                    <View className='w-full flex-row justify-center'>
                                        <ErrorText>{errors.bpm}</ErrorText>
                                    </View>
                                )}
                                <StyledDropdown
                                    open={openStatus}
                                    value={valueStatus}
                                    items={itemsStatus}
                                    setOpen={setOpenStatus}
                                    setValue={setValueStatus}
                                    onChangeValue={(v) => {
                                        // Update Formik when a value is selected
                                        if (
                                            v !== null &&
                                            v !== undefined &&
                                            v !== ""
                                        ) {
                                            setFieldValue("status", v);
                                            setFieldTouched("status", true);
                                        }
                                    }}
                                    setItems={setItemsStatus}
                                    placeholder='Choose status'
                                    zIndex={3000}
                                    zIndexInverse={1000}
                                />
                                {touched.status && errors.status && (
                                    <View className='w-full flex-row justify-center'>
                                        <ErrorText>{errors.status}</ErrorText>
                                    </View>
                                )}
                                <StyledDropdown
                                    open={openKey}
                                    value={valueKey}
                                    items={itemsKey}
                                    setOpen={setOpenKey}
                                    setValue={setValueKey}
                                    onChangeValue={(v) => {
                                        if (
                                            v !== null &&
                                            v !== undefined &&
                                            v !== ""
                                        ) {
                                            setFieldValue("songKey", v);
                                            setFieldTouched("songKey", true);
                                        }
                                    }}
                                    setItems={setItemsKey}
                                    placeholder='Choose key'
                                    zIndex={2000}
                                    zIndexInverse={2000}
                                />
                                {touched.songKey && errors.songKey && (
                                    <View className='w-full flex-row justify-center'>
                                        <ErrorText>{errors.songKey}</ErrorText>
                                    </View>
                                )}
                                <ScrollView
                                    horizontal={true}
                                    contentContainerClassName='items-center'
                                    className='flex-row gap-2 w-full'
                                >
                                    {tags
                                        .filter(
                                            (tag: BandSongTag) =>
                                                !values.tags.some(
                                                    (t) => t.name === tag.name
                                                )
                                        )
                                        .map((tag: BandSongTag) => {
                                            return (
                                                <Pressable
                                                    key={tag.tag_id}
                                                    className='rounded rounded-xl p-2 mr-2'
                                                    onPress={() => {
                                                        setFieldValue("tags", [
                                                            ...values.tags,
                                                            tag,
                                                        ]);
                                                    }}
                                                    style={{
                                                        backgroundColor:
                                                            tag.color,
                                                        opacity: 0.88,
                                                    }}
                                                >
                                                    <Text
                                                        className='text-white'
                                                        style={{
                                                            fontSize:
                                                                fontSize.base,
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                </ScrollView>
                                {!isAddingTag ? (
                                    <Pressable
                                        className='bg-accent-light dark:bg-accent-dark rounded-xl px-4 py-3 flex-row items-center justify-center'
                                        onPress={() => {
                                            setIsAddingTag(true);
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color:
                                                    colorScheme === "dark"
                                                        ? "#fff"
                                                        : "#222",
                                                fontWeight: "500",
                                                fontSize: fontSize.base,
                                            }}
                                        >
                                            Add a new tag
                                        </Text>
                                    </Pressable>
                                ) : (
                                    <Formik<addTagFormValues>
                                        validationSchema={addTagSchema}
                                        initialValues={{
                                            name: "",
                                            color: "#ef4444",
                                        }}
                                        onSubmit={async (
                                            values,
                                            { setSubmitting }
                                        ) => {
                                            if (!activeBand?.id) {
                                                Alert.alert(
                                                    "Error",
                                                    "No active band found"
                                                );
                                                return;
                                            }

                                            try {
                                                const response = await fetch(
                                                    `${apiUrl}/api/songs/tags/add`,
                                                    {
                                                        method: "POST",
                                                        headers: {
                                                            "Content-Type":
                                                                "application/json",
                                                        },
                                                        body: JSON.stringify({
                                                            name: values.name,
                                                            color: values.color,
                                                            bandId: activeBand.id,
                                                        }),
                                                    }
                                                );

                                                if (!response.ok) {
                                                    const errorText =
                                                        await response.text();
                                                    console.error(
                                                        "Server Error:",
                                                        errorText
                                                    );
                                                    throw new Error(
                                                        "Server rejected the tag"
                                                    );
                                                }
                                                await fetchTags();
                                                setIsAddingTag(false);
                                            } catch (error) {
                                                console.error(
                                                    "Tag Submit Error:",
                                                    error
                                                );
                                                Alert.alert(
                                                    "Error",
                                                    "Could not save tag. Check console for details."
                                                );
                                            } finally {
                                                setSubmitting(false);
                                            }
                                        }}
                                    >
                                        {({
                                            handleChange,
                                            handleBlur,
                                            handleSubmit,
                                            values,
                                            setFieldValue,
                                            errors,
                                            touched,
                                        }) => {
                                            const presetColors = [
                                                "#ef4444", // Red
                                                "#f97316", // Orange
                                                "#eab308", // Yellow
                                                "#22c55e", // Green
                                                "#3b82f6", // Blue
                                                "#a855f7", // Purple
                                                "#64748b", // Slate
                                                "#06b6d4", // Cyan
                                                "#f472b6", // Hot Pink
                                                "#8b5cf6", // Violet
                                                "#a3e635", // Lime
                                                "#ffb300", // Vivid Gold
                                            ];

                                            return (
                                                <View className='w-full bg-boxBackground-light dark:bg-boxBackground-dark rounded-xl p-4 border border-accent-light dark:border-accent-dark'>
                                                    <Text className='text-lg font-bold mb-3 dark:text-white'>
                                                        New Tag
                                                    </Text>

                                                    {/* 1. Name Input */}
                                                    <View className='mb-4'>
                                                        <StyledTextInput
                                                            placeholder='Tag Name'
                                                            value={values.name}
                                                            onChangeText={handleChange(
                                                                "name"
                                                            )}
                                                            onBlur={handleBlur(
                                                                "name"
                                                            )}
                                                        />
                                                        {touched.name &&
                                                            errors.name && (
                                                                <ErrorText>
                                                                    {
                                                                        errors.name
                                                                    }
                                                                </ErrorText>
                                                            )}
                                                    </View>

                                                    {/* 2. Color Presets */}
                                                    <Text
                                                        className='text-silverText mb-2 ml-1'
                                                        style={{
                                                            fontSize:
                                                                fontSize.base,
                                                        }}
                                                    >
                                                        Select Color
                                                    </Text>
                                                    <View className='flex-row flex-wrap gap-3 mb-4'>
                                                        {presetColors.map(
                                                            (c) => (
                                                                <Pressable
                                                                    key={c}
                                                                    onPress={() =>
                                                                        setFieldValue(
                                                                            "color",
                                                                            c
                                                                        )
                                                                    }
                                                                    style={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        borderRadius: 18,
                                                                        backgroundColor:
                                                                            c,
                                                                        borderWidth:
                                                                            values.color ===
                                                                            c
                                                                                ? 3
                                                                                : 1,
                                                                        borderColor:
                                                                            values.color ===
                                                                            c
                                                                                ? colorScheme ===
                                                                                  "dark"
                                                                                    ? "white"
                                                                                    : "black"
                                                                                : "#ddd",
                                                                    }}
                                                                />
                                                            )
                                                        )}
                                                    </View>

                                                    {/* 3. Custom Hex Input (For advanced users) */}
                                                    <View className='flex-row items-center gap-3 mb-6'>
                                                        <View
                                                            style={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: 8,
                                                                backgroundColor:
                                                                    values.color,
                                                                borderWidth: 1,
                                                                borderColor:
                                                                    "#ccc",
                                                            }}
                                                        />
                                                        <View className='flex-1'>
                                                            <StyledTextInput
                                                                placeholder='#000000'
                                                                value={
                                                                    values.color
                                                                }
                                                                onChangeText={handleChange(
                                                                    "color"
                                                                )} // Manual hex entry
                                                                maxLength={7}
                                                            />
                                                        </View>
                                                    </View>

                                                    {/* 4. Action Buttons */}
                                                    <View className='flex-row gap-3'>
                                                        <StyledButton
                                                            title='Cancel'
                                                            className='flex-1'
                                                            variant='accent'
                                                            onPress={() =>
                                                                setIsAddingTag(
                                                                    false
                                                                )
                                                            }
                                                        />
                                                        <StyledButton
                                                            title='Save Tag'
                                                            className='flex-1'
                                                            onPress={() =>
                                                                handleSubmit()
                                                            }
                                                        />
                                                    </View>
                                                </View>
                                            );
                                        }}
                                    </Formik>
                                )}
                                {values.tags.length > 0 && (
                                    <View className='w-full mt-2'>
                                        <Text
                                            className='text-silverText mb-2'
                                            style={{
                                                fontSize: fontSize.base,
                                            }}
                                        >
                                            Selected tags:
                                        </Text>
                                        <View className='flex-row flex-wrap gap-2'>
                                            {values.tags.map((tag) => (
                                                <Pressable
                                                    key={tag.tag_id}
                                                    className='rounded rounded-xl p-2'
                                                    onPress={() => {
                                                        setFieldValue(
                                                            "tags",
                                                            values.tags.filter(
                                                                (t) =>
                                                                    t.tag_id !==
                                                                    tag.tag_id
                                                            )
                                                        );
                                                    }}
                                                    style={{
                                                        backgroundColor:
                                                            tag.color,
                                                        borderWidth: 2,
                                                        borderColor:
                                                            colorScheme ===
                                                            "dark"
                                                                ? "#fff"
                                                                : "#000",
                                                        shadowColor:
                                                            colorScheme ===
                                                            "dark"
                                                                ? "#000"
                                                                : "#000",
                                                        shadowOffset: {
                                                            width: 0,
                                                            height: 2,
                                                        },
                                                        shadowOpacity: 0.25,
                                                        shadowRadius: 3.84,
                                                        elevation: 5,
                                                    }}
                                                >
                                                    <Text
                                                        className='text-white'
                                                        style={{
                                                            fontSize:
                                                                fontSize.base,
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                <StyledTextInput
                                    placeholder='Description'
                                    variant='rounded'
                                    value={values.description}
                                    onChangeText={handleChange("description")}
                                    onBlur={handleBlur("description")}
                                />
                                {touched.description && errors.description && (
                                    <View className='w-full flex-row justify-center'>
                                        <ErrorText>
                                            {errors.description}
                                        </ErrorText>
                                    </View>
                                )}
                                <Pressable
                                    className='bg-accent-light dark:bg-accent-dark rounded-xl px-4 py-3 flex-row items-center justify-center mt-2'
                                    onPress={() =>
                                        onPickBtnPress(setFieldValue)
                                    }
                                >
                                    <Text
                                        style={{
                                            color:
                                                colorScheme === "dark"
                                                    ? "#fff"
                                                    : "#222",
                                            fontWeight: "500",
                                            fontSize: fontSize.base,
                                        }}
                                    >
                                        {values.file
                                            ? `Selected: ${values.file.name ?? values.file.uri.split("/").pop()}`
                                            : "Pick audio file"}
                                    </Text>
                                </Pressable>
                                {formatFormikError(errors.file) && (
                                    <View className='w-full flex-row justify-center'>
                                        <ErrorText>
                                            {formatFormikError(errors.file)}
                                        </ErrorText>
                                    </View>
                                )}
                            </View>
                            {isUploading ? (
                                <View className='w-full items-center my-2'>
                                    <Text
                                        className='text-silverText mb-2'
                                        style={{ fontSize: fontSize.base }}
                                    >
                                        Uploading... {uploadProgress ?? 0}%
                                    </Text>
                                    <View className='w-full h-2 bg-accent-light dark:bg-accent-dark rounded-full'>
                                        <View
                                            style={{
                                                width: `${uploadProgress ?? 0}%`,
                                            }}
                                            className='h-2 bg-blue rounded-full'
                                        />
                                    </View>
                                    <View className='w-full flex-row justify-center mt-2'>
                                        <Text className='text-silverText text-center'>
                                            Please keep the app open while the
                                            song is uploading.
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <StyledButton
                                    title='Create Song'
                                    onPress={() => handleSubmit()}
                                    disabled={isUploading}
                                />
                            )}
                        </>
                    )}
                </Formik>
            </StyledModal>
            {filtersVisible && (
                <View className='absolute top-0 left-0 right-0 bottom-0 bg-black/20 w-full flex-1 z-10'></View>
            )}
            <Modal
                visible={filtersVisible}
                animationType='slide'
                transparent
                onRequestClose={closeFiltersModal}
            >
                <Pressable
                    onPress={closeFiltersModal}
                    className='flex-1 justify-end'
                >
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        className='bg-boxBackground-light dark:bg-boxBackground-dark border-t border-accent-light dark:border-accent-dark rounded-t-3xl p-6'
                    >
                        <View className='flex-row items-center justify-between mb-4'>
                            <Text
                                className='font-bold dark:text-white'
                                style={{ fontSize: fontSize.xl }}
                            >
                                Filters
                            </Text>
                            <Pressable
                                onPress={closeFiltersModal}
                                className='p-2 rounded-full bg-accent-light dark:bg-accent-dark active:opacity-70'
                            >
                                <X
                                    size={20}
                                    color={
                                        colorScheme === "dark" ? "#fff" : "#000"
                                    }
                                />
                            </Pressable>
                        </View>
                        <View className='mb-4'>
                            <Text
                                className='text-black dark:text-white mb-2'
                                style={{ fontSize: fontSize.xl }}
                            >
                                Key:
                            </Text>
                            <View className='flex-row items-center flex-wrap gap-2'>
                                {itemsKey.map((keyItem) => {
                                    const isSelected =
                                        selectedFilterKeys.includes(
                                            keyItem.value as string
                                        );
                                    return (
                                        <Pressable
                                            key={keyItem.value}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setSelectedFilterKeys(
                                                        selectedFilterKeys.filter(
                                                            (k) =>
                                                                k !==
                                                                keyItem.value
                                                        )
                                                    );
                                                } else {
                                                    setSelectedFilterKeys([
                                                        ...selectedFilterKeys,
                                                        keyItem.value as string,
                                                    ]);
                                                }
                                            }}
                                            className={`px-3 py-1 rounded-md border ${
                                                isSelected
                                                    ? "bg-transparentGreen border-green"
                                                    : "bg-transparent border-gray-400"
                                            }`}
                                        >
                                            <Text
                                                className='text-black dark:text-white'
                                                style={{
                                                    fontSize: fontSize.base,
                                                }}
                                            >
                                                {keyItem.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                        <View className='flex-row items-center gap-2 mb-4'>
                            <Text
                                className='text-black dark:text-white'
                                style={{ fontSize: fontSize.xl }}
                            >
                                Status:
                            </Text>
                            <Pressable
                                onPress={() => {
                                    setReadyStatusSelected(
                                        !readyStatusSelected
                                    );
                                }}
                                className={`px-2 py-1 rounded-md border ${
                                    readyStatusSelected
                                        ? "bg-transparentGreen border-green"
                                        : "bg-transparent border-gray-400"
                                }`}
                            >
                                <Text
                                    className='text-black dark:text-white'
                                    style={{ fontSize: fontSize.base }}
                                    maxFontSizeMultiplier={1.3}
                                >
                                    ready
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setFinishedStatusSelected(
                                        !finishedStatusSelected
                                    );
                                }}
                                className={`px-2 py-1 rounded-md border ${
                                    finishedStatusSelected
                                        ? "bg-transparentGreen border-green"
                                        : "bg-transparent border-gray-400"
                                }`}
                            >
                                <Text
                                    className='text-black dark:text-white'
                                    style={{ fontSize: fontSize.base }}
                                    maxFontSizeMultiplier={1.3}
                                >
                                    finished
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setDraftStatusSelected(
                                        !draftStatusSelected
                                    );
                                }}
                                className={`px-2 py-1 rounded-md border ${
                                    draftStatusSelected
                                        ? "bg-transparentGreen border-green"
                                        : "bg-transparent border-gray-400"
                                }`}
                            >
                                <Text
                                    className='text-black dark:text-white'
                                    style={{ fontSize: fontSize.base }}
                                    maxFontSizeMultiplier={1.3}
                                >
                                    draft
                                </Text>
                            </Pressable>
                        </View>
                        <View className='mb-4'>
                            <Text
                                className='text-black dark:text-white'
                                style={{ fontSize: fontSize.xl }}
                            >
                                Tags
                            </Text>
                            <View className='flex-row items-center flex-wrap'>
                                {tags.map((tag: BandSongTag) => (
                                    <Pressable
                                        key={tag.tag_id}
                                        className='rounded rounded-xl p-2 mr-2 mb-2'
                                        onPress={() => {
                                            const isSelected =
                                                selectedFilterTags.includes(
                                                    tag.tag_id
                                                );
                                            if (isSelected) {
                                                setSelectedFilterTags(
                                                    selectedFilterTags.filter(
                                                        (id) =>
                                                            id !== tag.tag_id
                                                    )
                                                );
                                            } else {
                                                setSelectedFilterTags([
                                                    ...selectedFilterTags,
                                                    tag.tag_id,
                                                ]);
                                            }
                                        }}
                                        style={{
                                            backgroundColor: tag.color,
                                            borderWidth:
                                                selectedFilterTags.includes(
                                                    tag.tag_id
                                                )
                                                    ? 2
                                                    : 0,
                                            borderColor:
                                                colorScheme === "dark"
                                                    ? "#fff"
                                                    : "#000",
                                            opacity:
                                                selectedFilterTags.includes(
                                                    tag.tag_id
                                                )
                                                    ? 1
                                                    : 0.7,
                                        }}
                                    >
                                        <Text
                                            className='text-white'
                                            style={{
                                                fontSize: fontSize.base,
                                                fontWeight:
                                                    selectedFilterTags.includes(
                                                        tag.tag_id
                                                    )
                                                        ? "bold"
                                                        : "normal",
                                            }}
                                        >
                                            {tag.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                        <View className='flex-row gap-2 w-full'>
                            <Pressable
                                onPress={() => {
                                    setReadyStatusSelected(false);
                                    setDraftStatusSelected(false);
                                    setFinishedStatusSelected(false);
                                    setSelectedFilterTags([]);
                                    setSelectedFilterKeys([]);
                                    // This will trigger the debounced useEffect to re-fetch with cleared filters
                                    setSearchText("");
                                }}
                                className='font-regular rounded rounded-xl bg-darkOrange p-2 flex-1 items-center justify-center'
                            >
                                <Text
                                    className='text-black'
                                    style={{ fontSize: fontSize.xl }}
                                >
                                    Reset
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={handleApplyFilters}
                                className='font-regular rounded rounded-xl bg-blue dark:bg-blue p-2 flex-1 items-center justify-center'
                            >
                                <Text
                                    className='text-white'
                                    style={{ fontSize: fontSize.xl }}
                                >
                                    Apply filters
                                </Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
            {bandsLoading ? (
                <View className='flex-1 w-full justify-center items-center'>
                    <ActivityIndicator size='large' color='#2B7FFF' />
                    <Text
                        className='text-silverText mt-4'
                        style={{ fontSize: fontSize.base }}
                    >
                        Loading bands...
                    </Text>
                </View>
            ) : bands.length === 0 ? (
                <NoBand />
            ) : (
                <>
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark mt-4 w-full px-5 py-2'>
                        <View className='flex-col items-start justify-center'>
                            <Text
                                className='text-black dark:text-white font-bold my-1'
                                style={{ fontSize: fontSize["2xl"] }}
                            >
                                {activeBand?.name} Songs & Setlists
                            </Text>
                            <Text
                                className='text-silverText'
                                style={{ fontSize: fontSize.base }}
                            >
                                Manage your band's songs and setlists
                            </Text>
                        </View>
                    </View>
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark w-full px-4'>
                        <SwitchTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            tabs={["Songs", "Setlists"]}
                        />
                    </View>
                    {activeTab === "Songs" ? (
                        <>
                            <View className='flex-col justify-center items-center gap-3 w-full border-b border-accent-light dark:border-accent-dark w-full px-5 py-3'>
                                <View className='flex-row justify-between items-center w-full'>
                                    <Text
                                        className='text-silverText'
                                        style={{ fontSize: fontSize.base }}
                                    >
                                        {sortedSongs.length} songs •{" "}
                                        {
                                            sortedSongs.filter(
                                                (song) =>
                                                    song.status === "finished"
                                            ).length
                                        }{" "}
                                        finished,{" "}
                                        {
                                            sortedSongs.filter(
                                                (song) =>
                                                    song.status === "ready"
                                            ).length
                                        }{" "}
                                        ready
                                    </Text>
                                    <StyledButton
                                        onPress={() =>
                                            setNewSongModalVisible(true)
                                        }
                                        title='+  New Song'
                                    />
                                </View>
                                <View className='flex-row items-center w-full gap-3'>
                                    <View style={{ flex: 1 }}>
                                        <StyledTextInput
                                            placeholder='Search songs'
                                            variant='rounded'
                                            value={searchText}
                                            onChangeText={setSearchText}
                                            onSubmitEditing={runFilterAndSearch}
                                        />
                                    </View>
                                    <Pressable>
                                        <ListMusic
                                            size={Math.min(fontSize["3xl"], 20)}
                                            style={{
                                                marginRight: 2,
                                                marginBottom: -2,
                                            }}
                                            color={
                                                colorScheme === "dark"
                                                    ? "#fff"
                                                    : "#000"
                                            }
                                        />
                                    </Pressable>
                                    <Menu>
                                        <MenuTrigger>
                                            <ArrowUpDown
                                                size={Math.min(
                                                    fontSize["3xl"],
                                                    20
                                                )}
                                                style={{
                                                    marginRight: 2,
                                                    marginBottom: -2,
                                                }}
                                                color={
                                                    colorScheme === "dark"
                                                        ? "#fff"
                                                        : "#000"
                                                }
                                            />
                                        </MenuTrigger>
                                        <MenuOptions
                                            customStyles={{
                                                optionsContainer: {
                                                    borderRadius: 10,
                                                    marginTop: 20,
                                                    backgroundColor:
                                                        colorScheme === "dark"
                                                            ? "#333"
                                                            : "#fff",
                                                },
                                            }}
                                        >
                                            <MenuOption
                                                onSelect={() => {
                                                    setSort("alphabetical_asc");
                                                }}
                                                text='Alphabetical A-Z'
                                                customStyles={{
                                                    optionText: {
                                                        color:
                                                            colorScheme ===
                                                            "dark"
                                                                ? "#fff"
                                                                : "#333",
                                                        paddingVertical: 8,
                                                        fontSize: fontSize.base,
                                                        width: "100%",
                                                    },
                                                }}
                                            />
                                            <MenuOption
                                                onSelect={() => {
                                                    setSort(
                                                        "alphabetical_desc"
                                                    );
                                                }}
                                                text='Alphabetical Z-A'
                                                customStyles={{
                                                    optionText: {
                                                        color:
                                                            colorScheme ===
                                                            "dark"
                                                                ? "#fff"
                                                                : "#333",
                                                        paddingVertical: 8,
                                                        fontSize: fontSize.base,
                                                        width: "100%", // TODO: fix length of option
                                                    },
                                                }}
                                            />
                                            <MenuOption
                                                onSelect={() => {
                                                    setSort("date_desc");
                                                }}
                                                text='Date added: latest to oldest'
                                                customStyles={{
                                                    optionText: {
                                                        color:
                                                            colorScheme ===
                                                            "dark"
                                                                ? "#fff"
                                                                : "#333",
                                                        paddingVertical: 8,
                                                        fontSize: fontSize.base,
                                                    },
                                                }}
                                            />
                                            <MenuOption
                                                onSelect={() => {
                                                    setSort("date_asc");
                                                }}
                                                text='Date added: oldest to latest'
                                                customStyles={{
                                                    optionText: {
                                                        color:
                                                            colorScheme ===
                                                            "dark"
                                                                ? "#fff"
                                                                : "#333",
                                                        paddingVertical: 8,
                                                        fontSize: fontSize.base,
                                                    },
                                                }}
                                            />
                                        </MenuOptions>
                                    </Menu>
                                    <Pressable
                                        onPress={() => {
                                            setFiltersVisible(true);
                                        }}
                                    >
                                        <SlidersHorizontal
                                            size={Math.min(fontSize["3xl"], 20)}
                                            style={{
                                                marginRight: 2,
                                                marginBottom: -2,
                                            }}
                                            color={
                                                colorScheme === "dark"
                                                    ? "#fff"
                                                    : "#000"
                                            }
                                        />
                                    </Pressable>
                                </View>
                            </View>
                            <ScrollView
                                className='flex-col px-3 py-4 w-full'
                                contentContainerStyle={{
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    paddingBottom: 25,
                                }}
                            >
                                {Array.isArray(sortedSongs) &&
                                    sortedSongs.map((song, idx) => (
                                        <SongCard
                                            songId={song.song_id}
                                            audioUrl={song.cloudurl}
                                            key={song.song_id || idx}
                                            songName={song.title}
                                            status={song.status}
                                            length={song.length}
                                            songKey={song.key}
                                            dateAdded={song.created_at}
                                            description={song.notes}
                                            songTags={song.tags}
                                        />
                                    ))}
                                {sortedSongs.length === 0 && (
                                    <View className='flex-1 w-full justify-center items-center'>
                                        <Text
                                            className='text-silverText'
                                            style={{ fontSize: fontSize.base }}
                                        >
                                            No songs found.
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        </>
                    ) : (
                        <></>
                    )}
                </>
            )}
        </PageContainer>
    );
};

export default songs;
