import ErrorText from "@/components/ErrorText";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StyledButton from "@/components/StyledButton";
import StyledModal from "@/components/StyledModal";
import StyledTextInput from "@/components/StyledTextInput";
import apiUrl from "@/config";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { auth } from "@/lib/firebase";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Formik } from "formik";
import { Calendar, Target, Trash2, Play, Square } from "lucide-react-native";
import { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
    View,
} from "react-native";
import * as yup from "yup";

type Practice = {
    practice_id: number;
    duration_minutes: number;
    practice_date: string;
    notes: string | null;
};

const practice = () => {
    const { user } = useAuth();
    const { activeBand } = useBand();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [practices, setPractices] = useState<Practice[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);

    // Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Timer States
    const [timerActive, setTimerActive] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerActive) {
            interval = setInterval(() => {
                setTimerSeconds((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive]);

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const fetchPractices = async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`${apiUrl}/api/practices`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch practices");
            const data = await res.json();
            setPractices(data);
        } catch (error) {
            console.error("Error fetching practices:", error);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPractices();
        }, [])
    );

    const handleDelete = async (id: number) => {
        Alert.alert("Delete Practice", "Are you sure you want to delete this practice record?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await auth.currentUser?.getIdToken();
                        const res = await fetch(`${apiUrl}/api/practices/${id}`, { 
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (!res.ok) throw new Error("Failed to delete practice");
                        fetchPractices();
                    } catch (error: any) {
                        console.error(error);
                        Alert.alert("Error", error.message || "Could not delete practice");
                    }
                }
            }
        ]);
    };

    const practiceSchema = yup.object().shape({
        durationMinutes: yup
            .number()
            .typeError("Duration must be a number")
            .min(1, "Must be at least 1 minute")
            .required("Duration is required"),
        notes: yup.string().nullable().max(500, "Notes are too long")
    });

    const openCreateModal = () => {
        setSelectedDate(new Date());
        setModalVisible(true);
    };

    const PracticeCard = ({ practice }: { practice: Practice }) => {
        return (
            <View className="bg-boxBackground-light dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark rounded-2xl p-4 w-full mb-3">
                <View className="flex-row justify-between items-start">
                    <View className="mr-3 mt-1">
                        <Target color={isDark ? "#fff" : "#000"} size={Math.min(fontSize["3xl"], 28)} />
                    </View>
                    
                    <View className="flex-1 flex-col">
                        <Text className="font-bold text-black dark:text-white" style={{ fontSize: fontSize.xl }}>
                            {practice.duration_minutes} min
                        </Text>

                        {practice.notes && (
                            <Text className="text-silverText mt-1" style={{ fontSize: fontSize.base }}>
                                {practice.notes}
                            </Text>
                        )}

                        <View className="flex-row items-center mt-3 gap-3 flex-wrap">
                            <View className="flex-row items-center gap-1">
                                <Calendar color="#A1A1A1" size={Math.min(fontSize.lg, 16)} />
                                <Text className="text-silverText" style={{ fontSize: fontSize.sm }}>
                                    {new Date(practice.practice_date).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                        <Pressable onPress={() => handleDelete(practice.practice_id)}>
                            <Trash2 color="#FF4b4b" size={Math.min(fontSize.xl, 20)} />
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <PageContainer>
            <View className="w-full h-full flex-col max-w-[800px] self-center">
                <PageHeader title="My Practice" subtitle="Track your practice sessions" />

                <View className="flex-row justify-between items-center w-full px-5 py-4 border-b border-accent-light dark:border-accent-dark">
                    <Text className="text-silverText font-medium" style={{ fontSize: fontSize.base }}>
                        Total Sessions: {practices.length}
                    </Text>
                    <StyledButton title="+ Add Practice" onPress={openCreateModal} />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2B7FFF" className="mt-10" />
                ) : loadError ? (
                    <View className="flex-1 justify-center items-center mt-10">
                        <Text className="text-silverText text-center mb-4" style={{ fontSize: fontSize.base }}>
                            Failed to load practices.
                        </Text>
                        <StyledButton title="Retry" onPress={fetchPractices} />
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} className="px-4 mt-4">
                        {practices.length === 0 ? (
                            <Text className="text-silverText text-center mt-10" style={{ fontSize: fontSize.lg }}>
                                You haven't recorded any practice sessions yet.
                            </Text>
                        ) : (
                            <View className="pb-20">
                                {practices.map((p) => (
                                    <PracticeCard key={p.practice_id} practice={p} />
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            <StyledModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                canClose={true}
                title="New Practice Session"
            >
                <Formik
                    initialValues={{ durationMinutes: "", notes: "" }}
                    validationSchema={practiceSchema}
                    onSubmit={async (values, { setSubmitting, resetForm }) => {
                        try {
                            const payload = {
                                durationMinutes: parseInt(values.durationMinutes, 10),
                                practiceDate: selectedDate.toISOString(),
                                notes: values.notes,
                                bandId: activeBand?.id || null // Optional relation
                            };

                            const token = await auth.currentUser?.getIdToken();
                            const res = await fetch(`${apiUrl}/api/practices`, {
                                method: "POST",
                                headers: { 
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`
                                },
                                body: JSON.stringify(payload),
                            });

                            if (!res.ok) throw new Error("Failed to save practice session");

                            // Stop and reset timer if it was running
                            setTimerActive(false);
                            setTimerSeconds(0);

                            setModalVisible(false);
                            resetForm();
                            fetchPractices();
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to save");
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, setFieldValue }) => (
                        <View className="w-full my-3 flex-col gap-4">
                            <View>
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-silverText" style={{ fontSize: fontSize.sm }}>Duration (minutes)*</Text>
                                    
                                    {/* Timer Controls */}
                                    {timerActive ? (
                                        <View className="flex-row items-center gap-3">
                                            <View className="flex-row items-center gap-1">
                                                <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                <Text className="font-bold text-red-500" style={{ fontSize: fontSize.sm }}>
                                                    {formatTime(timerSeconds)}
                                                </Text>
                                            </View>
                                            <Pressable 
                                                onPress={() => {
                                                    setTimerActive(false);
                                                    const mins = Math.max(1, Math.ceil(timerSeconds / 60));
                                                    setFieldValue("durationMinutes", mins.toString());
                                                    setTimerSeconds(0);
                                                }}
                                                className="bg-red-500/20 px-3 py-1.5 rounded-full flex-row items-center gap-1"
                                            >
                                                <Square size={12} color="#ef4444" fill="#ef4444" />
                                                <Text className="text-red-500 font-medium" style={{ fontSize: fontSize.xs }}>Stop</Text>
                                            </Pressable>
                                        </View>
                                    ) : (
                                        <Pressable 
                                            onPress={() => {
                                                setTimerSeconds(0);
                                                setTimerActive(true);
                                            }}
                                            className="bg-accent-light dark:bg-accent-dark px-3 py-1.5 rounded-full flex-row items-center gap-1"
                                        >
                                            <Play size={12} color={isDark ? "#fff" : "#000"} fill={isDark ? "#fff" : "#000"} />
                                            <Text className="text-black dark:text-white font-medium" style={{ fontSize: fontSize.xs }}>Start Timer</Text>
                                        </Pressable>
                                    )}
                                </View>
                                
                                <StyledTextInput
                                    placeholder="e.g. 60"
                                    value={values.durationMinutes}
                                    onChangeText={handleChange("durationMinutes")}
                                    onBlur={handleBlur("durationMinutes")}
                                    keyboardType="numeric"
                                />
                                {touched.durationMinutes && errors.durationMinutes && <ErrorText>{errors.durationMinutes}</ErrorText>}
                            </View>

                            <View className="z-10 mt-2">
                                <Text className="text-silverText mb-2" style={{ fontSize: fontSize.sm }}>Date*</Text>
                                <Pressable
                                    onPress={() => setShowDatePicker(true)}
                                    className="bg-white dark:bg-darkGray border border-accent-light dark:border-accent-dark rounded-2xl p-3"
                                >
                                    <View className="flex-row items-center gap-2">
                                        <Calendar color={isDark ? "#fff" : "#000"} size={20} />
                                        <Text className="text-black dark:text-white" style={{ fontSize: fontSize.sm }}>
                                            {selectedDate.toLocaleDateString()}
                                        </Text>
                                    </View>
                                </Pressable>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={selectedDate}
                                        mode="date"
                                        display={Platform.OS === "ios" ? "inline" : "default"}
                                        onChange={(event, date) => {
                                            setShowDatePicker(Platform.OS === "ios");
                                            if (date) setSelectedDate(date);
                                        }}
                                    />
                                )}
                            </View>

                            <View>
                                <Text className="text-silverText mb-2" style={{ fontSize: fontSize.sm }}>Notes (optional)</Text>
                                <StyledTextInput
                                    placeholder="What did you practice?"
                                    value={values.notes}
                                    onChangeText={handleChange("notes")}
                                    onBlur={handleBlur("notes")}
                                    multiline
                                />
                                {touched.notes && errors.notes && <ErrorText>{errors.notes}</ErrorText>}
                            </View>

                            <StyledButton 
                                title={isSubmitting ? "Saving..." : "Save Session"} 
                                onPress={() => handleSubmit()} 
                            />
                        </View>
                    )}
                </Formik>
            </StyledModal>
        </PageContainer>
    );
};

export default practice;
