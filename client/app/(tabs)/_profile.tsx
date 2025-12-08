import { View, Text, Image } from "react-native";
import { useBand } from "@/context/BandContext";
import { useAuth } from "@/context/AuthContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";

const profile = () => {
    const { activeBand } = useBand();
    const { user } = useAuth();
    const fontSize = useAccessibleFontSize();

    console.log(user?.photoURL);

    return (
        <>
            <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark mt-4 w-full px-5 py-2'>
                <View className='flex-col items-start justify-center'>
                    <Text
                        className='text-black dark:text-white font-bold my-1'
                        style={{ fontSize: fontSize["2xl"] }}>
                        Profile
                    </Text>
                    <Text
                        className='text-silverText'
                        style={{ fontSize: fontSize.base }}>
                        Your personal settings
                    </Text>
                </View>
            </View>
            <View className='flex-row items-center'>
                <Image
                    source={{ uri: user?.photoURL || "" }}
                    className='w-12 h-12 rounded-full'
                />
                <View className='flex-col'>
                    <Text
                        className='text-silverText'
                        style={{ fontSize: fontSize.base }}>
                        {user?.username}
                    </Text>
                    <Text
                        className='text-silverText'
                        style={{ fontSize: fontSize.base }}>
                        {user?.email}
                    </Text>
                </View>
            </View>
        </>
    );
};

export default profile;
