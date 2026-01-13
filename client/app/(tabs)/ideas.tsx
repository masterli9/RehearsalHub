import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import PageContainer from "@/components/PageContainer";
import NoBand from "@/components/NoBand";
import { useBand } from "@/context/BandContext";
import { useAuth } from "@/context/AuthContext";
import { useAudioPlayer } from "expo-audio";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { useColorScheme } from "@/hooks/use-color-scheme";
import ErrorText from "@/components/ErrorText";
import { useState, useEffect } from "react";
import { MenuOption } from "react-native-popup-menu";
import SwitchTabs from "@/components/SwitchTabs";
import { SwitchBandModal } from "@/components/SwitchBandModal";
import PageHeader from "@/components/PageHeader";

const ideas = () => {
    const { bands, bandsLoading, activeBand } = useBand();
    const { user } = useAuth();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();

    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("All Ideas");

    return (
        <PageContainer noBandState={!bandsLoading && bands.length === 0}>
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
                    {activeTab === "All Ideas" ? (
                        <View className='flex-1 w-full justify-center items-center'>
                            <Text>All ideas</Text>
                        </View>
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
