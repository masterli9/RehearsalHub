import ErrorText from "@/components/ErrorText";
import NoBand from "@/components/NoBand";
import PageContainer from "@/components/PageContainer";
import StyledButton from "@/components/StyledButton";
import StyledDropdown from "@/components/StyledDropdown";
import StyledModal from "@/components/StyledModal";
import StyledTextInput from "@/components/StyledTextInput";
import apiUrl from "@/config";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Formik } from "formik";
import { Calendar, Clock, MapPin, Music } from "lucide-react-native";
import { useEffect, useState } from "react";
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
import SwitchTabs from "@/components/SwitchTabs";
import PageHeader from "@/components/PageHeader";

type Event = {
    event_id: number;
    title: string;
    type: "rehearsal" | "concert"; // TODO: add recording
    date_time: string;
    description: string | null;
    band_id: number;
    place: string | null;
    length: string | null;
    songs: Array<{
        song_id: number;
        title: string;
        key: string | null;
        status: string | null;
    }>;
};

type Song = {
    song_id: number;
    title: string;
    key: string | null;
    status: string | null;
};

const events = () => {
    const { user } = useAuth();
    const { bands, activeBand, bandsLoading } = useBand();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();

    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [pastEvents, setPastEvents] = useState<Event[]>([]);
    const [eventsLoading, setEventsLoading] = useState<boolean>(false);
    const [newEventModalVisible, setNewEventModalVisible] =
        useState<boolean>(false);
    const [eventType, setEventType] = useState<"rehearsal" | "concert">(
        "rehearsal"
    );
    const [songs, setSongs] = useState<Song[]>([]);
    const [songsLoading, setSongsLoading] = useState<boolean>(false);

    // Date/Time picker states
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<Date>(new Date());

    const [activeTab, setActiveTab] = useState<string>("Upcoming");

    const fetchEvents = async () => {
        if (!activeBand?.id) {
            setUpcomingEvents([]);
            setPastEvents([]);
            return;
        }
        setEventsLoading(true);
        try {
            const response = await fetch(
                `${apiUrl}/api/events?bandId=${activeBand.id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Error fetching events, status: ${response.status}`
                );
            }

            const data = await response.json();
            setUpcomingEvents(
                data.filter(
                    (event: Event) => new Date(event.date_time) >= new Date()
                )
            );
            setPastEvents(
                data.filter(
                    (event: Event) => new Date(event.date_time) < new Date()
                )
            );
        } catch (error) {
            console.error("Error fetching events:", error);
            setUpcomingEvents([]);
            setPastEvents([]);
        } finally {
            setEventsLoading(false);
        }
    };

    const fetchSongs = async () => {
        if (!activeBand?.id) {
            setSongs([]);
            return;
        }
        setSongsLoading(true);
        try {
            const response = await fetch(
                `${apiUrl}/api/songs?bandId=${activeBand.id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

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
        } finally {
            setSongsLoading(false);
        }
    };

    useEffect(() => {
        if (activeBand?.id) {
            fetchEvents();
            if (newEventModalVisible) {
                fetchSongs();
            }
        }
    }, [activeBand?.id, newEventModalVisible]);

    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const eventDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dateStr = "";
        if (diffDays === 0) {
            dateStr = "Today";
        } else if (diffDays === 1) {
            dateStr = "Tomorrow";
        } else if (diffDays === -1) {
            dateStr = "Yesterday";
        } else if (diffDays > 0 && diffDays <= 7) {
            dateStr = `In ${diffDays} days`;
        } else {
            dateStr = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year:
                    date.getFullYear() !== now.getFullYear()
                        ? "numeric"
                        : undefined,
            });
        }

        const timeStr = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        return `${dateStr} at ${timeStr}`;
    };

    const formatInterval = (interval: string | null | undefined) => {
        if (!interval || typeof interval !== "string") return "N/A";
        // PostgreSQL interval format: HH:MM:SS or similar
        // Parse and format nicely
        try {
            const parts = interval.split(":");
            if (parts.length >= 2) {
                const hours = parseInt(parts[0], 10) || 0;
                const minutes = parseInt(parts[1], 10) || 0;
                if (hours > 0) {
                    return `${hours}h ${minutes}m`;
                }
                return `${minutes}m`;
            }
            return interval;
        } catch (error) {
            console.error("Error formatting interval:", error, interval);
            return "N/A";
        }
    };

    const EventCard = ({ event }: { event: Event }) => {
        const typeColors = {
            rehearsal: {
                bg: "bg-transparentGreen",
                text: "text-green",
                cardBg: "bg-transparentGreen",
            },
            concert: {
                bg: "bg-transparentBlue",
                text: "text-blue",
                cardBg: "bg-transparentBlue",
            },
            recording: {
                bg: "bg-transparentViolet",
                text: "text-violet",
                cardBg: "bg-transparentViolet",
            },
        };

        const colors = typeColors[event.type] || typeColors.rehearsal;

        return (
            <View
                className={`${colors.cardBg} border border-accent-light dark:border-accent-dark rounded-2xl p-5 w-full mb-3`}>
                <View className='flex-row justify-between items-start mb-2'>
                    <View className='flex-1' style={{ minWidth: 0 }}>
                        <View
                            className='flex-row items-center gap-2'
                            style={{ flexWrap: "wrap" }}>
                            <Text
                                className='font-bold text-black dark:text-white'
                                style={{ fontSize: fontSize.xl }}
                                numberOfLines={2}
                                maxFontSizeMultiplier={1.3}>
                                {event.title}
                            </Text>
                            <Text
                                className={`${colors.bg} ${colors.text} my-1 px-3 py-1 rounded-xl`}
                                style={{ fontSize: fontSize.base }}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.3}>
                                {event.type}
                            </Text>
                        </View>
                        <View
                            className='flex-row items-center gap-3 mt-2'
                            style={{ flexWrap: "wrap" }}>
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
                                    }}
                                    numberOfLines={1}
                                    maxFontSizeMultiplier={1.3}>
                                    {formatDateTime(event.date_time)}
                                </Text>
                            </View>
                            {event.type === "concert" && event.place && (
                                <View className='flex-row items-center gap-1'>
                                    <MapPin
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
                                        }}
                                        numberOfLines={1}
                                        maxFontSizeMultiplier={1.3}>
                                        {event.place}
                                    </Text>
                                </View>
                            )}
                            {event.type === "concert" && event.length && (
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
                                        }}
                                        numberOfLines={1}
                                        maxFontSizeMultiplier={1.3}>
                                        {formatInterval(event.length)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
                {event.type === "rehearsal" && event.description && (
                    <Text
                        className='text-silverText my-2'
                        style={{ fontSize: fontSize.base }}
                        numberOfLines={3}
                        maxFontSizeMultiplier={1.3}>
                        {event.description}
                    </Text>
                )}
                {event.type === "rehearsal" &&
                    event.songs &&
                    event.songs.length > 0 && (
                        <View className='mt-2'>
                            <View className='flex-row items-center gap-2 mb-2'>
                                <Music
                                    color={"#A1A1A1"}
                                    size={Math.min(fontSize["2xl"], 18)}
                                />
                                <Text
                                    className='text-silverText font-semibold'
                                    style={{ fontSize: fontSize.base }}>
                                    Songs to rehearse:
                                </Text>
                            </View>
                            <View className='flex-row items-center gap-2 flex-wrap'>
                                {event.songs.map((song) => (
                                    <View
                                        key={song.song_id}
                                        className='px-3 py-1 rounded-xl bg-accent-light dark:bg-accent-dark'>
                                        <Text
                                            className='text-black dark:text-white text-sm'
                                            // style={{ fontSize: fontSize.sm }}
                                        >
                                            {song.title}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                {event.type === "concert" && (
                    <View className='mt-2'>
                        <Text
                            className='text-silverText italic'
                            style={{ fontSize: fontSize.sm }}>
                            Setlist: Coming soon
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const rehearsalSchema = yup.object().shape({
        title: yup
            .string()
            .trim()
            .min(2, "Title should be at least 2 characters")
            .max(255, "Title should be less than 255 characters")
            .required("Title is required"),
        date: yup.date().required("Date is required"),
        time: yup.date().required("Time is required"),
        description: yup
            .string()
            .nullable()
            .transform((value, originalValue) =>
                typeof originalValue === "string" && originalValue.trim() !== ""
                    ? originalValue.trim()
                    : null
            )
            .max(1000, "Description should be less than 1000 characters"),
        songs: yup.array().of(yup.number()).nullable(),
    });

    const concertSchema = yup.object().shape({
        title: yup
            .string()
            .trim()
            .min(2, "Title should be at least 2 characters")
            .max(255, "Title should be less than 255 characters")
            .required("Title is required"),
        place: yup
            .string()
            .trim()
            .min(2, "Place should be at least 2 characters")
            .max(255, "Place should be less than 255 characters")
            .required("Place is required"),
        date: yup.date().required("Date is required"),
        time: yup.date().required("Time is required"),
        length: yup
            .string()
            .nullable()
            .transform((value, originalValue) =>
                typeof originalValue === "string" && originalValue.trim() !== ""
                    ? originalValue.trim()
                    : null
            ),
    });

    const closeModalAndReset = () => {
        setNewEventModalVisible(false);
        setEventType("rehearsal");
        setSelectedDate(new Date());
        setSelectedTime(new Date());
        setShowDatePicker(false);
        setShowTimePicker(false);
    };

    // Format a Date as local time with the device's offset (YYYY-MM-DDTHH:mm:ss±HH:MM)
    const formatLocalDateTimeWithOffset = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        const offsetMinutes = -date.getTimezoneOffset(); // invert to get POSIX-style offset
        const offsetSign = offsetMinutes >= 0 ? "+" : "-";
        const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(
            2,
            "0"
        );
        const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMins}`;
    };

    // Dropdown states for event type
    const [openType, setOpenType] = useState(false);
    const [valueType, setValueType] = useState<"rehearsal" | "concert">(
        "rehearsal"
    );
    const [itemsType, setItemsType] = useState([
        { label: "Rehearsal", value: "rehearsal" },
        { label: "Concert", value: "concert" },
    ]);

    useEffect(() => {
        if (!newEventModalVisible) {
            setOpenType(false);
            setValueType("rehearsal");
            setEventType("rehearsal");
        }
    }, [newEventModalVisible]);

    return (
        <PageContainer noBandState={!bandsLoading && bands.length === 0}>
            <StyledModal
                visible={newEventModalVisible}
                onClose={closeModalAndReset}
                canClose={true}
                wide={true}
                title='Create an event'
                subtitle="Add a new rehearsal or concert to your band's schedule">
                <Formik
                    validationSchema={
                        eventType === "rehearsal"
                            ? rehearsalSchema
                            : concertSchema
                    }
                    initialValues={{
                        title: "",
                        place: "",
                        date: new Date(),
                        time: new Date(),
                        description: "",
                        songs: [] as number[],
                        length: "",
                    }}
                    enableReinitialize={false}
                    onSubmit={async (
                        values,
                        { setFieldError, setSubmitting }
                    ) => {
                        try {
                            if (!activeBand?.id) {
                                Alert.alert("Error", "No active band found");
                                return;
                            }

                            // Combine date and time in local timezone
                            const dateTime = new Date(values.date);
                            const time = new Date(values.time);
                            dateTime.setHours(time.getHours());
                            dateTime.setMinutes(time.getMinutes());
                            dateTime.setSeconds(0);
                            dateTime.setMilliseconds(0);

                            // Create ISO string that includes the device offset to preserve the entered timezone
                            const localDateTimeString =
                                formatLocalDateTimeWithOffset(dateTime);

                            const requestBody: any = {
                                title: values.title.trim(),
                                type: eventType,
                                date_time: localDateTimeString,
                                bandId: String(activeBand.id).trim(),
                            };

                            if (eventType === "rehearsal") {
                                if (values.description) {
                                    requestBody.description =
                                        values.description.trim();
                                }
                                if (values.songs && values.songs.length > 0) {
                                    requestBody.songs = values.songs;
                                }
                            } else {
                                // Concert
                                requestBody.place = values.place.trim();
                                if (values.length) {
                                    // Convert length to interval format (HH:MM:SS)
                                    // User might enter "2:30" or "2h 30m" - for now, simple format
                                    requestBody.length = values.length.trim();
                                }
                            }

                            const response = await fetch(
                                `${apiUrl}/api/events/create`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(requestBody),
                                }
                            );

                            if (!response.ok) {
                                const err = await response
                                    .json()
                                    .catch(() => ({}));
                                throw new Error(
                                    err.error || "Failed to create event"
                                );
                            }

                            closeModalAndReset();
                            fetchEvents();
                        } catch (err: any) {
                            console.error(err);
                            Alert.alert(
                                "Error",
                                err.message || "Failed to create event"
                            );
                        } finally {
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
                    }) => (
                        <>
                            <View className='flex-col w-full gap-4 my-3'>
                                <StyledDropdown
                                    open={openType}
                                    value={valueType}
                                    items={itemsType}
                                    setOpen={setOpenType}
                                    setValue={setValueType}
                                    onChangeValue={(v) => {
                                        // Update Formik and eventType state when a value is selected
                                        if (
                                            v !== null &&
                                            v !== undefined &&
                                            v !== ""
                                        ) {
                                            const newType = v as
                                                | "rehearsal"
                                                | "concert";
                                            setEventType(newType);
                                            setFieldValue("type", v);
                                            setFieldTouched("type", true);
                                        }
                                    }}
                                    setItems={setItemsType}
                                    placeholder='Choose event type'
                                    zIndex={3000}
                                    zIndexInverse={1000}
                                />
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

                                {/* Date Picker */}
                                <View>
                                    <Pressable
                                        onPress={() => setShowDatePicker(true)}
                                        className='bg-white dark:bg-darkGray border border-accent-light dark:border-accent-dark rounded-2xl p-3'>
                                        <View className='flex-row items-center gap-2'>
                                            <Calendar
                                                color={
                                                    colorScheme === "dark"
                                                        ? "#fff"
                                                        : "#000"
                                                }
                                                size={20}
                                            />
                                            <Text
                                                className='text-black dark:text-white'
                                                style={{
                                                    fontSize: fontSize.sm,
                                                }}>
                                                {values.date.toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        weekday: "long",
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                    }
                                                )}
                                            </Text>
                                        </View>
                                    </Pressable>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={values.date}
                                            mode='date'
                                            display={
                                                Platform.OS === "ios"
                                                    ? "spinner"
                                                    : "default"
                                            }
                                            onChange={(event, selectedDate) => {
                                                if (Platform.OS === "android") {
                                                    setShowDatePicker(false);
                                                }
                                                if (selectedDate) {
                                                    setFieldValue(
                                                        "date",
                                                        selectedDate
                                                    );
                                                    setSelectedDate(
                                                        selectedDate
                                                    );
                                                    if (
                                                        Platform.OS ===
                                                        "android"
                                                    ) {
                                                        setFieldTouched(
                                                            "date",
                                                            true
                                                        );
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    {touched.date && errors.date && (
                                        <View className='w-full flex-row justify-center mt-1'>
                                            <ErrorText>
                                                {typeof errors.date === "string"
                                                    ? errors.date
                                                    : "Date is required"}
                                            </ErrorText>
                                        </View>
                                    )}
                                </View>

                                {/* Time Picker */}
                                <View>
                                    <Pressable
                                        onPress={() => setShowTimePicker(true)}
                                        className='bg-white dark:bg-darkGray border border-accent-light dark:border-accent-dark rounded-2xl p-3'>
                                        <View className='flex-row items-center gap-2'>
                                            <Clock
                                                color={
                                                    colorScheme === "dark"
                                                        ? "#fff"
                                                        : "#000"
                                                }
                                                size={20}
                                            />
                                            <Text
                                                className='text-black dark:text-white'
                                                style={{
                                                    fontSize: fontSize.sm,
                                                }}>
                                                {values.time.toLocaleTimeString(
                                                    "en-US",
                                                    {
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                        hour12: true,
                                                    }
                                                )}
                                            </Text>
                                        </View>
                                    </Pressable>
                                    {showTimePicker && (
                                        <DateTimePicker
                                            value={values.time}
                                            mode='time'
                                            display={
                                                Platform.OS === "ios"
                                                    ? "spinner"
                                                    : "default"
                                            }
                                            onChange={(event, selectedTime) => {
                                                if (Platform.OS === "android") {
                                                    setShowTimePicker(false);
                                                }
                                                if (selectedTime) {
                                                    setFieldValue(
                                                        "time",
                                                        selectedTime
                                                    );
                                                    setSelectedTime(
                                                        selectedTime
                                                    );
                                                    if (
                                                        Platform.OS ===
                                                        "android"
                                                    ) {
                                                        setFieldTouched(
                                                            "time",
                                                            true
                                                        );
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    {touched.time && errors.time && (
                                        <View className='w-full flex-row justify-center mt-1'>
                                            <ErrorText>
                                                {typeof errors.time === "string"
                                                    ? errors.time
                                                    : "Time is required"}
                                            </ErrorText>
                                        </View>
                                    )}
                                </View>

                                {eventType === "rehearsal" && (
                                    <>
                                        <StyledTextInput
                                            placeholder='Plan (optional)'
                                            variant='rounded'
                                            value={values.description}
                                            onChangeText={handleChange(
                                                "description"
                                            )}
                                            onBlur={handleBlur("description")}
                                            multiline
                                            numberOfLines={4}
                                        />
                                        {touched.description &&
                                            errors.description && (
                                                <View className='w-full flex-row justify-center'>
                                                    <ErrorText>
                                                        {errors.description}
                                                    </ErrorText>
                                                </View>
                                            )}

                                        {/* Song Selection */}
                                        <View>
                                            <Text
                                                className='text-black dark:text-white mb-2'
                                                style={{
                                                    fontSize: fontSize.base,
                                                }}>
                                                Songs to rehearse (optional):
                                            </Text>
                                            <ScrollView
                                                horizontal={true}
                                                contentContainerClassName='items-center'
                                                className='flex-row gap-2 w-full'>
                                                {songs.map((song) => {
                                                    const isSelected =
                                                        values.songs.includes(
                                                            song.song_id
                                                        );
                                                    return (
                                                        <Pressable
                                                            key={song.song_id}
                                                            className='rounded-xl p-2 mr-2'
                                                            onPress={() => {
                                                                if (
                                                                    isSelected
                                                                ) {
                                                                    setFieldValue(
                                                                        "songs",
                                                                        values.songs.filter(
                                                                            (
                                                                                id
                                                                            ) =>
                                                                                id !==
                                                                                song.song_id
                                                                        )
                                                                    );
                                                                } else {
                                                                    setFieldValue(
                                                                        "songs",
                                                                        [
                                                                            ...values.songs,
                                                                            song.song_id,
                                                                        ]
                                                                    );
                                                                }
                                                            }}
                                                            style={{
                                                                backgroundColor:
                                                                    isSelected
                                                                        ? colorScheme ===
                                                                          "dark"
                                                                            ? "#2B7FFF"
                                                                            : "#2B7FFF"
                                                                        : colorScheme ===
                                                                            "dark"
                                                                          ? "#262626"
                                                                          : "#EDEDED",
                                                                borderWidth:
                                                                    isSelected
                                                                        ? 2
                                                                        : 1,
                                                                borderColor:
                                                                    isSelected
                                                                        ? colorScheme ===
                                                                          "dark"
                                                                            ? "#fff"
                                                                            : "#000"
                                                                        : colorScheme ===
                                                                            "dark"
                                                                          ? "#262626"
                                                                          : "#EDEDED",
                                                            }}>
                                                            <Text
                                                                className={
                                                                    isSelected
                                                                        ? "text-white"
                                                                        : "text-black dark:text-white"
                                                                }
                                                                style={{
                                                                    fontSize:
                                                                        fontSize.base,
                                                                    fontWeight:
                                                                        isSelected
                                                                            ? "bold"
                                                                            : "normal",
                                                                }}>
                                                                {song.title}
                                                            </Text>
                                                        </Pressable>
                                                    );
                                                })}
                                            </ScrollView>
                                        </View>
                                    </>
                                )}

                                {eventType === "concert" && (
                                    <>
                                        <StyledTextInput
                                            placeholder='Place'
                                            variant='rounded'
                                            value={values.place}
                                            onChangeText={handleChange("place")}
                                            onBlur={handleBlur("place")}
                                        />
                                        {touched.place && errors.place && (
                                            <View className='w-full flex-row justify-center'>
                                                <ErrorText>
                                                    {errors.place}
                                                </ErrorText>
                                            </View>
                                        )}
                                        <StyledTextInput
                                            placeholder='Length (e.g., 2:30:00 for 2h 30m)'
                                            variant='rounded'
                                            value={values.length}
                                            onChangeText={handleChange(
                                                "length"
                                            )}
                                            onBlur={handleBlur("length")}
                                        />
                                        <Text
                                            className='text-silverText text-xs mt-1 ml-1'
                                            style={{ fontSize: fontSize.xs }}>
                                            Format: HH:MM:SS (e.g., 2:30:00)
                                        </Text>
                                        {touched.length && errors.length && (
                                            <View className='w-full flex-row justify-center'>
                                                <ErrorText>
                                                    {errors.length}
                                                </ErrorText>
                                            </View>
                                        )}
                                        <View className='bg-accent-light dark:bg-accent-dark rounded-xl p-3'>
                                            <Text
                                                className='text-silverText italic'
                                                style={{
                                                    fontSize: fontSize.sm,
                                                }}>
                                                Setlist: Coming soon
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </View>
                            <StyledButton
                                title='Create Event'
                                onPress={() => handleSubmit()}
                            />
                        </>
                    )}
                </Formik>
            </StyledModal>

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
                        title={`${activeBand?.name} Events`}
                        subtitle="Manage your band's rehearsals and concerts"
                    />
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark w-full px-4'>
                        <SwitchTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            tabs={["Upcoming", "Past"]}
                        />
                    </View>
                    <View className='flex-col justify-center items-center gap-3 w-full border-b border-accent-light dark:border-accent-dark w-full px-5 py-3'>
                        <View className='flex-row justify-between items-center w-full'>
                            <Text
                                className='text-silverText'
                                style={{ fontSize: fontSize.base }}>
                                {activeTab === "Upcoming"
                                    ? upcomingEvents.length + " upcoming event"
                                    : pastEvents.length + " past event"}

                                {activeTab === "Upcoming"
                                    ? upcomingEvents.length !== 1
                                        ? "s"
                                        : ""
                                    : pastEvents.length !== 1
                                      ? "s"
                                      : ""}
                            </Text>
                            <StyledButton
                                onPress={() => setNewEventModalVisible(true)}
                                title='+  New Event'
                            />
                        </View>
                    </View>
                    {eventsLoading ? (
                        <View className='flex-1 w-full justify-center items-center py-10'>
                            <ActivityIndicator size='large' color='#2B7FFF' />
                            <Text
                                className='text-silverText mt-4'
                                style={{ fontSize: fontSize.base }}>
                                Loading events...
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            className='flex-col px-3 py-4 w-full'
                            contentContainerStyle={{
                                alignItems: "center",
                                justifyContent: "flex-start",
                                paddingBottom: 25,
                            }}>
                            {(Array.isArray(pastEvents) &&
                                pastEvents.length > 0) ||
                            (Array.isArray(upcomingEvents) &&
                                upcomingEvents.length > 0) ? (
                                activeTab === "Upcoming" ? (
                                    upcomingEvents.map((event) => (
                                        <EventCard
                                            key={event.event_id}
                                            event={event}
                                        />
                                    ))
                                ) : (
                                    pastEvents.map((event) => (
                                        <EventCard
                                            key={event.event_id}
                                            event={event}
                                        />
                                    ))
                                )
                            ) : (
                                <View className='flex-1 w-full justify-center items-center py-10'>
                                    <Text
                                        className='text-silverText'
                                        style={{ fontSize: fontSize.base }}>
                                        No events yet.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </>
            )}
        </PageContainer>
    );
};

export default events;
