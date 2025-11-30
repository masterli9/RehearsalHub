import PageContainer from "@/components/PageContainer";
import { View, Text, ScrollView, Pressable } from "react-native";
import NoBand from "@/components/NoBand";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import SwitchTabs from "@/components/SwitchTabs";
import { useState } from "react";
import StyledButton from "@/components/StyledButton";
import { Play } from "lucide-react-native";
import { SquarePen } from "lucide-react-native";
import { Calendar } from "lucide-react-native";
import { Clock } from "lucide-react-native";
import { Hash } from "lucide-react-native";
import { EllipsisVertical } from "lucide-react-native";
import { useColorScheme } from "react-native";

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
            <View className='bg-boxBackground-light dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark rounded-2xl p-5 w-full mb-3'>
                <View className='flex-row justify-between items-center'>
                    <View className='flex-col'>
                        <View className='flex-row items-center gap-2'>
                            <Text
                                className='font-bold text-black dark:text-white'
                                style={{ fontSize: fontSize.xl }}>
                                {songName}
                            </Text>
                            <Text
                                className={`${status === "ready" ? "text-green bg-transparentGreen" : status === "draft" ? "text-violet bg-transparentViolet" : status === "finished" && "text-blue bg-transparentBlue"} my-1 px-3 py-1 rounded-xl mr-2`}
                                style={{ fontSize: fontSize.base }}>
                                {status}
                            </Text>
                        </View>
                        <View className='flex-row gap-2'>
                            <View className='flex-row items-center gap-1'>
                                <Clock
                                    color={"#A1A1A1"}
                                    size={fontSize["2xl"]}
                                    style={{ marginRight: 2, marginBottom: -2 }}
                                />
                                <Text
                                    className='text-silverText'
                                    style={{
                                        fontSize: fontSize.base,
                                        alignItems: "center",
                                    }}>
                                    {length}
                                </Text>
                            </View>
                            <View className='flex-row items-center gap-1'>
                                <Hash
                                    color={"#A1A1A1"}
                                    size={fontSize["2xl"]}
                                    style={{ marginRight: 2, marginBottom: -2 }}
                                />
                                <Text
                                    className='text-silverText'
                                    style={{
                                        fontSize: fontSize.base,
                                        alignItems: "center",
                                    }}>
                                    {songKey}
                                </Text>
                            </View>
                            <View className='flex-row items-center gap-1'>
                                <Calendar
                                    color={"#A1A1A1"}
                                    size={fontSize["2xl"]}
                                    style={{ marginRight: 2, marginBottom: -2 }}
                                />
                                <Text
                                    className='text-silverText'
                                    style={{
                                        fontSize: fontSize.base,
                                        alignItems: "center",
                                    }}>
                                    {dateAdded}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View className='flex-row gap-4 items-center'>
                        <Play
                            color={colorScheme === "dark" ? "white" : "black"}
                        />
                        <Pressable>
                            <SquarePen
                                color={
                                    colorScheme === "dark" ? "white" : "black"
                                }
                            />
                        </Pressable>
                        <Pressable>
                            <EllipsisVertical
                                color={
                                    colorScheme === "dark" ? "white" : "black"
                                }
                            />
                        </Pressable>
                    </View>
                </View>
                <Text
                    className='text-silverText my-2'
                    style={{ fontSize: fontSize.base }}>
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
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark mt-4 w-full px-3 py-2'>
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
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark w-full px-3'>
                        <SwitchTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            tabs={["Songs", "Setlists"]}
                        />
                    </View>
                    {activeTab === "Songs" ? (
                        <>
                            <View className='flex-row justify-between items-center w-full border-b border-accent-light dark:border-accent-dark w-full px-5 py-3'>
                                <Text
                                    className='text-silverText'
                                    style={{ fontSize: fontSize.base }}>
                                    4 songs • 3 ready
                                </Text>
                                <StyledButton
                                    onPress={() => {}}
                                    title='+  New Song'
                                />
                            </View>
                            <ScrollView
                                className='flex-col px-3 py-4 w-full'
                                contentContainerStyle={{
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
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
