import NoBand from "@/components/NoBand";
import PageContainer from "@/components/PageContainer";
import StyledButton from "@/components/StyledButton";
import StyledTextInput from "@/components/StyledTextInput";
import SwitchTabs from "@/components/SwitchTabs";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
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
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
    View,
} from "react-native";

const songs = () => {
    const { user } = useAuth();
    const { bands, activeBand } = useBand();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();

    const [activeTab, setActiveTab] = useState<string>("Songs");

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
            <View className="bg-boxBackground-light dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark rounded-2xl p-5 w-full mb-3">
                <View
                    className="flex-row justify-between items-center"
                    style={{ flexWrap: "wrap" }}
                >
                    <View
                        className="flex-col"
                        style={{ flexShrink: 1, flex: 1, minWidth: 0 }}
                    >
                        <View
                            className="flex-row items-center gap-2"
                            style={{ flexWrap: "wrap" }}
                        >
                            <Text
                                className="font-bold text-black dark:text-white"
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
                            className="flex-row gap-2"
                            style={{ flexWrap: "wrap" }}
                        >
                            <View className="flex-row items-center gap-1">
                                <Clock
                                    color={"#A1A1A1"}
                                    size={Math.min(fontSize["2xl"], 20)}
                                    style={{ marginRight: 2, marginBottom: -2 }}
                                />
                                <Text
                                    className="text-silverText"
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
                            <View className="flex-row items-center gap-1">
                                <Hash
                                    color={"#A1A1A1"}
                                    size={Math.min(fontSize["2xl"], 20)}
                                    style={{ marginRight: 2, marginBottom: -2 }}
                                />
                                <Text
                                    className="text-silverText"
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
                            <View className="flex-row items-center gap-1">
                                <Calendar
                                    color={"#A1A1A1"}
                                    size={Math.min(fontSize["2xl"], 20)}
                                    style={{ marginRight: 2, marginBottom: -2 }}
                                />
                                <Text
                                    className="text-silverText"
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
                        className="flex-row gap-4 items-center"
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
                    className="text-silverText my-2"
                    style={{ fontSize: fontSize.base }}
                    numberOfLines={3}
                    maxFontSizeMultiplier={1.3}
                >
                    {description}
                </Text>
            </View>
        );
    };

    return (
        <PageContainer noBandState={bands.length === 0}>
            {bands.length === 0 ? (
                <NoBand />
            ) : (
                <>
                    <View className="flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark mt-4 w-full px-3 py-2">
                        <View className="flex-col items-start justify-center">
                            <Text
                                className="text-black dark:text-white font-bold my-1"
                                style={{ fontSize: fontSize["2xl"] }}
                            >
                                {activeBand?.name} Songs & Setlists
                            </Text>
                            <Text
                                className="text-silverText"
                                style={{ fontSize: fontSize.base }}
                            >
                                Manage your band's songs and setlists
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark w-full px-3">
                        <SwitchTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            tabs={["Songs", "Setlists"]}
                        />
                    </View>
                    {activeTab === "Songs" ? (
                        <>
                            <View className="flex-col justify-center items-center gap-3 w-full border-b border-accent-light dark:border-accent-dark w-full px-5 py-3">
                                <View className="flex-row justify-between items-center w-full">
                                    <Text
                                        className="text-silverText"
                                        style={{ fontSize: fontSize.base }}
                                    >
                                        4 songs • 2 ready
                                    </Text>
                                    <StyledButton
                                        onPress={() => {}}
                                        title="+  New Song"
                                    />
                                </View>
                                <View className="flex-row justify-between items-center w-full">
                                    <StyledTextInput
                                        placeholder="Search songs"
                                        variant="rounded"
                                    />
                                </View>
                            </View>
                            <ScrollView
                                className="flex-col px-3 py-4 w-full"
                                contentContainerStyle={{
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingBottom: 25,
                                }}
                            >
                                <SongCard
                                    songName="Song Name"
                                    status="ready"
                                    dateAdded="dateAdded"
                                    description="This is a very long description that will test the expansitivity of the song card and also its legibility"
                                    songKey="Am"
                                    length="3:33"
                                />
                                <SongCard
                                    songName="Song Name"
                                    status="finished"
                                    dateAdded="dateAdded"
                                    description="desc"
                                    songKey="Am"
                                    length="3:33"
                                />
                                <SongCard
                                    songName="Song Name"
                                    status="draft"
                                    dateAdded="dateAdded"
                                    description="desc"
                                    songKey="Am"
                                    length="3:33"
                                />
                                <SongCard
                                    songName="Song Name"
                                    status="ready"
                                    dateAdded="dateAdded"
                                    description="desc"
                                    songKey="Am"
                                    length="3:33"
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
