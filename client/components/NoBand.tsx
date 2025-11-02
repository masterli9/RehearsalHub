import { View, Text } from "react-native";

export default function NoBand() {
    return (
        <View className='flex-col items-center justify-center bg-darkWhite dark:bg-boxBackground-dark p-5 rounded-2xl'>
            <Text className='text-black dark:text-white text-2xl font-bold'>
                You don't have a band yet!
            </Text>
            <Text className='text-silverText dark:text-silverText text-base'>
                Create or join a band in the band tab.
            </Text>
        </View>
    );
}
