import {
    View,
    Text,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    FlatList,
} from "react-native";
import { useBand } from "@/context/BandContext";
import { useAuth } from "@/context/AuthContext";
import NoBand from "@/components/NoBand";
import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import StyledTextInput from "@/components/StyledTextInput";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const chat = () => {
    const { bands, activeBand, fetchUserBands } = useBand();
    const { user } = useAuth();

    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight?.() ?? 0;

    // Offset pro iOS, aby se počítal i header (React Navigation)
    const KBO = Platform.OS === "ios" ? headerHeight : 0;

    // Mock messages data - replace with real data later
    const [messages] = useState([
        {
            id: "1",
            text: "This is a very fucking long message that should not split any word in half you know what I mean right i guess so",
        },
        { id: "2", text: "MessageBubble" },
    ]);

    return (
        <PageContainer noBandState={bands.length === 0}>
            {bands.length === 0 ? (
                <NoBand />
            ) : (
                <>
                    <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark my-4 w-full px-5 py-2'>
                        <View className='flex-col items-start justify-center'>
                            <Text className='text-black dark:text-white text-2xl font-bold my-1'>
                                {activeBand?.name} Chat
                            </Text>
                            <Text className='text-silverText'>
                                Chat with your bandmates
                            </Text>
                        </View>
                    </View>
                    <KeyboardAvoidingView
                        className='flex-1 w-full'
                        behavior='padding'
                        keyboardVerticalOffset={KBO}>
                        <FlatList
                            data={messages}
                            keyExtractor={(item) => item.id}
                            className='flex-1 w-full px-2'
                            contentContainerStyle={{
                                flexGrow: 1,
                                justifyContent: "flex-end",
                            }}
                            inverted={false}
                            keyboardShouldPersistTaps='handled'
                            renderItem={({ item }) => (
                                <View className='my-2 w-full flex-col items-end justify-center'>
                                    <Text className='text-base text-silverText px-5'>
                                        ThisIsAReallyFuckingLongUsernameAndItShouldBeAlignedToTheLeft
                                    </Text>
                                    <View className='bg-darkWhite dark:bg-accent-dark p-3 rounded-2xl max-w-[66.67%]'>
                                        <Text className='text-black dark:text-white text-base text-wrap'>
                                            {item.text}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        />
                        <View className='flex-row w-full gap-3 px-2'>
                            <StyledTextInput
                                variant='rounded'
                                className='flex-1 bg-darkWhite dark:bg-accent-dark'
                                placeholder='Message'
                            />
                            <Pressable
                                className={`bg-black dark:bg-white rounded-m p-2 active:bg-accent-dark dark:active:bg-accent-light active:scale-95 justify-center items-center`}
                                onPress={() => {}}>
                                <Text className='text-base font-bold text-white dark:text-black'>
                                    Send
                                </Text>
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </>
            )}
        </PageContainer>
    );
};

export default chat;
