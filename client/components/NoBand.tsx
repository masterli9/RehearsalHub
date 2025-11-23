import { View, Text } from "react-native";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";

export default function NoBand() {
    const fontSize = useAccessibleFontSize();
    
    return (
        <View className='flex-col items-center justify-center bg-darkWhite dark:bg-boxBackground-dark p-5 rounded-2xl'>
            <Text className='text-black dark:text-white font-bold' style={{ fontSize: fontSize['2xl'] }}>
                You don't have a band yet!
            </Text>
            <Text className='text-silverText dark:text-silverText' style={{ fontSize: fontSize.base }}>
                Create or join a band in the band tab.
            </Text>
        </View>
    );
}
