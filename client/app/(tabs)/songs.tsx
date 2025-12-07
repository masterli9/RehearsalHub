import ErrorText from "@/components/ErrorText";
import NoBand from "@/components/NoBand";
import PageContainer from "@/components/PageContainer";
import StyledButton from "@/components/StyledButton";
import StyledDropdown from "@/components/StyledDropdown";
import StyledModal from "@/components/StyledModal";
import StyledTextInput from "@/components/StyledTextInput";
import SwitchTabs from "@/components/SwitchTabs";
import apiUrl from "@/config";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { Formik } from "formik";
import {
    Calendar,
    Clock,
    EllipsisVertical,
    Hash,
    Play,
    SquarePen,
    ArrowUpDown,
    DiscAlbum,
    ListMusic,
    SlidersHorizontal,
    X,
} from "lucide-react-native";
import { useState, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
    View,
    Alert,
    Modal,
} from "react-native";
import * as yup from "yup";
import * as DocumentPicker from "expo-document-picker";
import { createAudioPlayer } from "expo-audio";

const songs = () => {
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

    // filter states
    const [filtersVisible, setFiltersVisible] = useState<boolean>(false);
    const [readyStatusSelected, setReadyStatusSelected] =
        useState<boolean>(true);
    const [draftStatusSelected, setDraftStatusSelected] =
        useState<boolean>(true);
    const [finishedStatusSelected, setFinishedStatusSelected] =
        useState<boolean>(true);

    const [searchText, setSearchText] = useState("");

    const runFilterAndSearch = () => {
        const statuses = [
            readyStatusSelected ? "ready" : null,
            finishedStatusSelected ? "finished" : null,
            draftStatusSelected ? "draft" : null,
        ].filter(Boolean) as string[];

        fetchSongs({ status: statuses, search: searchText });
    };

    const handleApplyFilters = () => {
        runFilterAndSearch();
        closeFiltersModal();
    };

    const stopProgressAnimation = () => {
        if (progressAnimationRef.current) {
            clearInterval(progressAnimationRef.current);
            progressAnimationRef.current = null;
        }
    };

    const fetchSongs = async (params?: {
        status?: string[];
        tags?: string;
        search?: string;
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
                if (params.tags) {
                    query += `&tags=${encodeURIComponent(params.tags)}`;
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
            setSongs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching songs:", error);
            setSongs([]);
        }
    };

    useEffect(() => {
        // When the active band changes, fetch all songs for that band.
        // Filtering is applied manually via the search and filter controls.
        if (activeBand?.id) {
            fetchSongs();
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
        file: any;
    };

    const SongCard = ({
        songName,
        status,
        length,
        songKey,
        dateAdded,
        description,
    }: {
        songName: string;
        status: "ready" | "draft" | "finished";
        length: string;
        songKey: string;
        dateAdded: string;
        description: string;
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
        return (
            <View className='bg-boxBackground-light dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark rounded-2xl p-5 w-full mb-3'>
                <View
                    className='flex-row justify-between items-center'
                    style={{ flexWrap: "wrap" }}>
                    <View
                        className='flex-col'
                        style={{ flexShrink: 1, flex: 1, minWidth: 0 }}>
                        <View
                            className='flex-row items-center gap-2'
                            style={{ flexWrap: "wrap" }}>
                            <Text
                                className='font-bold text-black dark:text-white'
                                style={{ fontSize: fontSize.xl }}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.3}>
                                {songName}
                            </Text>
                            <Text
                                className={`${status === "ready" ? "text-green bg-transparentGreen" : status === "draft" ? "text-violet bg-transparentViolet" : status === "finished" && "text-blue bg-transparentBlue"} my-1 px-3 py-1 rounded-xl mr-2`}
                                style={{ fontSize: fontSize.base }}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.3}>
                                {status}
                            </Text>
                        </View>
                        <View
                            className='flex-row gap-2'
                            style={{ flexWrap: "wrap" }}>
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
                                    maxFontSizeMultiplier={1.3}>
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
                                    maxFontSizeMultiplier={1.3}>
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
                                    maxFontSizeMultiplier={1.3}>
                                    {formatDate(dateAdded)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View
                        className='flex-row gap-4 items-center'
                        style={{ flexShrink: 0 }}>
                        <Play
                            color={colorScheme === "dark" ? "white" : "black"}
                            size={20}
                        />
                        <Pressable>
                            <SquarePen
                                color={
                                    colorScheme === "dark" ? "white" : "black"
                                }
                                size={20}
                            />
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
                        maxFontSizeMultiplier={1.3}>
                        {description}
                    </Text>
                )}
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
            .transform((value) => (value ? value.trim() : null))
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
        file: yup.object().shape({
            uri: yup.string().required("File is required"),
        }),
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
        const createResp = await fetch(`${apiUrl}/api/songs/upload-url`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, contentType, bandId }),
        });

        if (!createResp.ok) {
            const err = await createResp.json().catch(() => ({}));
            throw new Error(err.error || "Failed to get upload url");
        }
        const { uploadUrl, publicUrl } = await createResp.json();

        const fileResp = await fetch(localUri);
        const blob = await fileResp.blob();

        // Use XMLHttpRequest to track upload progress
        const putResp = await new Promise<XMLHttpRequest>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", contentType);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentCompleted = Math.round(
                        (event.loaded * 100) / event.total
                    );
                    // The file upload is ~95% of the process
                    // Clamp percentCompleted at 100 to prevent it from going over
                    onProgress(
                        Math.floor(Math.min(percentCompleted, 100) * 0.95)
                    );
                }
            };

            xhr.onload = () => {
                // File upload is complete, now we save metadata.
                onProgress(95);
                resolve(xhr);
            };
            xhr.onerror = () => reject(new Error("Upload to storage failed"));
            xhr.onabort = () => reject(new Error("Upload aborted"));

            xhr.send(blob);
        });

        if (putResp.status < 200 || putResp.status >= 300) {
            throw new Error("Upload to storage failed");
        }

        // Return the public URL for the next step (saving metadata)
        return { publicUrl };
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
                try {
                    const audioPlayer = createAudioPlayer();
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
                title='Create a song'
                subtitle="Add a new song to your band's repertoire and choose its tags and status">
                <Formik<NewSongFormValues>
                    validationSchema={newSongSchema}
                    initialValues={{
                        title: "",
                        bpm: "",
                        status: "",
                        length: "",
                        songKey: "",
                        description: "",
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
                            const { publicUrl } = await uploadFileToSignedUrl({
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
                                        cloudurl: publicUrl,
                                        length:
                                            values.file.duration ||
                                            values.length ||
                                            null,
                                        bpm: bpmValue,
                                        notes:
                                            values.description?.trim() || null,
                                        songKey: values.songKey.trim(),
                                        status: values.status.trim(),
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
                    validateOnChange={false}>
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
                                    }>
                                    <Text
                                        style={{
                                            color:
                                                colorScheme === "dark"
                                                    ? "#fff"
                                                    : "#222",
                                            fontWeight: "500",
                                            fontSize: fontSize.base,
                                        }}>
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
                                        style={{ fontSize: fontSize.base }}>
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
                onRequestClose={closeFiltersModal}>
                <Pressable
                    onPress={closeFiltersModal}
                    className='flex-1 justify-end'>
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        className='bg-boxBackground-light dark:bg-boxBackground-dark border-t border-accent-light dark:border-accent-dark rounded-t-3xl p-6'>
                        <View className='flex-row items-center justify-between mb-4'>
                            <Text
                                className='font-bold dark:text-white'
                                style={{ fontSize: fontSize.xl }}>
                                Filters
                            </Text>
                            <Pressable
                                onPress={closeFiltersModal}
                                className='p-2 rounded-full bg-accent-light dark:bg-accent-dark active:opacity-70'>
                                <X
                                    size={20}
                                    color={
                                        colorScheme === "dark" ? "#fff" : "#000"
                                    }
                                />
                            </Pressable>
                        </View>
                        <View className='flex-row items-center gap-2 mb-4'>
                            <Text style={{ fontSize: fontSize.xl }}>
                                Status:
                            </Text>
                            <Pressable
                                onPress={() => {
                                    setReadyStatusSelected(
                                        !readyStatusSelected
                                    );
                                }}
                                className={`px-2 py-1 rounded-m border ${
                                    readyStatusSelected
                                        ? "bg-transparentGreen border-green"
                                        : "bg-transparent border-gray-400"
                                }`}>
                                <Text
                                    style={{ fontSize: fontSize.base }}
                                    maxFontSizeMultiplier={1.3}>
                                    ready
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setFinishedStatusSelected(
                                        !finishedStatusSelected
                                    );
                                }}
                                className={`px-2 py-1 rounded-m border ${
                                    finishedStatusSelected
                                        ? "bg-transparentGreen border-green"
                                        : "bg-transparent border-gray-400"
                                }`}>
                                <Text
                                    style={{ fontSize: fontSize.base }}
                                    maxFontSizeMultiplier={1.3}>
                                    finished
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setDraftStatusSelected(
                                        !draftStatusSelected
                                    );
                                }}
                                className={`px-2 py-1 rounded-m border ${
                                    draftStatusSelected
                                        ? "bg-transparentGreen border-green"
                                        : "bg-transparent border-gray-400"
                                }`}>
                                <Text
                                    style={{ fontSize: fontSize.base }}
                                    maxFontSizeMultiplier={1.3}>
                                    draft
                                </Text>
                            </Pressable>
                        </View>
                        <View>
                            <Text style={{ fontSize: fontSize.xl }}>Tags</Text>
                        </View>
                        <View>
                            <Text style={{ fontSize: fontSize.xl }}>
                                Additional
                            </Text>
                            {/* <StyledDropdown
                                open={openKey}
                                value={valueKey}
                                items={itemsKey}
                                setOpen={setOpenKey}
                                setValue={setValueKey}
                                setItems={setItemsKey}
                                placeholder='Choose key'
                                zIndex={2000}
                                zIndexInverse={2000}
                            /> */}
                        </View>
                        <View className='flex-row gap-2 w-full'>
                            <Pressable className='font-regular rounded rounded-xl bg-accent-light dark:bg-accent-dark p-2 flex-1 items-center justify-center'>
                                <Text style={{ fontSize: fontSize.xl }}>
                                    Reset
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={handleApplyFilters}
                                className='font-regular rounded rounded-xl bg-blue dark:bg-blue p-2 flex-1 items-center justify-center'>
                                <Text
                                    className='text-white'
                                    style={{ fontSize: fontSize.xl }}>
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
                        style={{ fontSize: fontSize.base }}>
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
                                style={{ fontSize: fontSize["2xl"] }}>
                                {activeBand?.name} Songs & Setlists
                            </Text>
                            <Text
                                className='text-silverText'
                                style={{ fontSize: fontSize.base }}>
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
                                        style={{ fontSize: fontSize.base }}>
                                        {songs.length} songs •{" "}
                                        {
                                            songs.filter(
                                                (song) =>
                                                    song.status === "finished"
                                            ).length
                                        }{" "}
                                        finished
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
                                        />
                                    </Pressable>
                                    <Pressable>
                                        <ArrowUpDown
                                            size={Math.min(fontSize["3xl"], 20)}
                                            style={{
                                                marginRight: 2,
                                                marginBottom: -2,
                                            }}
                                        />
                                    </Pressable>
                                    <Pressable
                                        onPress={() => {
                                            setFiltersVisible(true);
                                        }}>
                                        <SlidersHorizontal
                                            size={Math.min(fontSize["3xl"], 20)}
                                            style={{
                                                marginRight: 2,
                                                marginBottom: -2,
                                            }}
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
                                }}>
                                {Array.isArray(songs) &&
                                    songs.map((song, idx) => (
                                        <SongCard
                                            key={song.song_id || idx}
                                            songName={song.title}
                                            status={song.status}
                                            length={song.length} // This will be the object { minutes, seconds }
                                            songKey={song.key} // The column name is `key` in the DB
                                            dateAdded={song.created_at} // The column name is `created_at`
                                            description={song.notes}
                                        />
                                    ))}
                                {songs.length === 0 && (
                                    <View className='flex-1 w-full justify-center items-center'>
                                        <Text
                                            className='text-silverText'
                                            style={{ fontSize: fontSize.base }}>
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
