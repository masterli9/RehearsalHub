import ErrorText from "@/components/ErrorText";
import NoBand from "@/components/NoBand";
import PageContainer from "@/components/PageContainer";
import StyledButton from "@/components/StyledButton";
import StyledDropdown from "@/components/StyledDropdown";
import StyledModal from "@/components/StyledModal";
import StyledTextInput from "@/components/StyledTextInput";
import SwitchTabs from "@/components/SwitchTabs";
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
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
    View,
} from "react-native";
import * as yup from "yup";

const songs = () => {
    const { user } = useAuth();
    const { bands, activeBand, bandsLoading } = useBand();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();

    const [activeTab, setActiveTab] = useState<string>("Songs");
    const [newSongModalVisible, setNewSongModalVisible] =
        useState<boolean>(false);

    type NewSongFormValues = {
        title: string;
        songKey: string;
        length: string;
        description: string;
        status: string;
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
                                    {length}
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
                                    {songKey}
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
                                    {dateAdded}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View
                        className='flex-row gap-4 items-center'
                        style={{ flexShrink: 0 }}
                    >
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
                <Text
                    className='text-silverText my-2'
                    style={{ fontSize: fontSize.base }}
                    numberOfLines={3}
                    maxFontSizeMultiplier={1.3}
                >
                    {description}
                </Text>
            </View>
        );
    };

    const newSongSchema = yup.object().shape({
        title: yup
            .string()
            .min(2, "Title should be at least 2 characters")
            .max(255, "Title should be less than 255 characters")
            .required("Title is required"),
        length: yup
            .string()
            .required("Length is required")
            .matches(
                /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/,
                "Enter length as m:ss or mm:ss or h:mm:ss (e.g. 3:45 or 12:01 or 1:05:22)"
            ),
        description: yup
            .string()
            .max(1000, "Description should be less than 1000 characters"),
        songKey: yup.string().required("Song key is required"),
        status: yup
            .string()
            .oneOf(["ready", "draft", "finished"])
            .required("Status is required"),
    });
    // Dropdown states
    const [openStatus, setOpenStatus] = useState(false);
    const [valueStatus, setValueStatus] = useState(null);
    const [itemsStatus, setItemsStatus] = useState([
        { label: "Finished", value: "Finished" },
        { label: "Rehearsed", value: "Rehearsed" },
        { label: "Draft", value: "Draft" },
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

    return (
        <PageContainer noBandState={bands.length === 0}>
            <StyledModal
                visible={newSongModalVisible}
                onClose={() => {
                    setNewSongModalVisible(false);
                    setOpenKey(false);
                    setOpenStatus(false);
                    setValueKey(null);
                    setValueStatus(null);
                }}
                title='Create a song'
                subtitle="Add a new song to your band's repertoire and choose its tags and status"
            >
                <Formik<NewSongFormValues>
                    validationSchema={newSongSchema}
                    initialValues={{
                        title: "",
                        status: "",
                        length: "",
                        songKey: "",
                        description: "",
                    }}
                    onSubmit={(values) => {}}
                    validateOnBlur={false}
                    validateOnChange={false}
                >
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
                                <StyledDropdown
                                    open={openStatus}
                                    value={valueStatus}
                                    items={itemsStatus}
                                    setOpen={setOpenStatus}
                                    setValue={setValueStatus}
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
                                <StyledTextInput
                                    placeholder='Length'
                                    variant='rounded'
                                    value={values.length}
                                    onChangeText={handleChange("length")}
                                    onBlur={handleBlur("length")}
                                />
                                {touched.length && errors.length && (
                                    <View className='w-full flex-row justify-center'>
                                        <ErrorText>{errors.length}</ErrorText>
                                    </View>
                                )}
                                <StyledDropdown
                                    open={openKey}
                                    value={valueKey}
                                    items={itemsKey}
                                    setOpen={setOpenKey}
                                    setValue={setValueKey}
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
                                        <ErrorText>{errors.title}</ErrorText>
                                    </View>
                                )}
                            </View>
                            <StyledButton
                                title='Create Song'
                                onPress={() => handleSubmit()}
                            />
                        </>
                    )}
                </Formik>
            </StyledModal>
            {bandsLoading && (
                <View className='flex-1 w-full justify-center items-center'>
                    <ActivityIndicator size='large' color='#2B7FFF' />
                    <Text
                        className='text-silverText mt-4'
                        style={{ fontSize: fontSize.base }}
                    >
                        Loading bands...
                    </Text>
                </View>
            )}
            {bands.length === 0 ? (
                <NoBand />
            ) : (
                <>
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark mt-4 w-full px-3 py-2'>
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
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark w-full px-3'>
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
                                        4 songs • 2 ready
                                    </Text>
                                    <StyledButton
                                        onPress={() =>
                                            setNewSongModalVisible(true)
                                        }
                                        title='+  New Song'
                                    />
                                </View>
                                <View className='flex-row justify-between items-center w-full'>
                                    <StyledTextInput
                                        placeholder='Search songs'
                                        variant='rounded'
                                    />
                                </View>
                            </View>
                            <ScrollView
                                className='flex-col px-3 py-4 w-full'
                                contentContainerStyle={{
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingBottom: 25,
                                }}
                            >
                                <SongCard
                                    songName='Song Name'
                                    status='ready'
                                    dateAdded='dateAdded'
                                    description='This is a very long description that will test the expansitivity of the song card and also its legibility'
                                    songKey='Am'
                                    length='3:33'
                                />
                                <SongCard
                                    songName='Song Name'
                                    status='finished'
                                    dateAdded='dateAdded'
                                    description='desc'
                                    songKey='Am'
                                    length='3:33'
                                />
                                <SongCard
                                    songName='Song Name'
                                    status='draft'
                                    dateAdded='dateAdded'
                                    description='desc'
                                    songKey='Am'
                                    length='3:33'
                                />
                                <SongCard
                                    songName='Song Name'
                                    status='ready'
                                    dateAdded='dateAdded'
                                    description='desc'
                                    songKey='Am'
                                    length='3:33'
                                />
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
