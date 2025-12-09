import { View, Text, Image, Pressable } from "react-native";
import { useBand } from "@/context/BandContext";
import { useAuth } from "@/context/AuthContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { LogOut, SquarePen } from "lucide-react-native";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

const profile = () => {
    const { activeBand } = useBand();
    const { user, logout } = useAuth();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();

    const { themePreference, setThemePreference } = useTheme();

    const options = [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
        { label: "System", value: "system" },
    ] as const;

    return (
        <SafeAreaView className='flex-1'>
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
            <View className='flex-1 items-center my-5 px-5'>
                <View className='flex-col bg-darkWhite dark:bg-darkGray rounded rounded-xl w-full'>
                    <View className='flex-row items-center px-3 gap-3 border-b border-accent-light dark:border-accent-dark py-3'>
                        <Image
                            source={{ uri: user?.photoURL || "" }}
                            className='w-12 h-12 rounded-full'
                        />
                        <View className='flex-col'>
                            <Text
                                className='text-black dark:text-white font-bold'
                                style={{ fontSize: fontSize["2xl"] }}>
                                {user?.username}
                            </Text>
                            <Text
                                className='text-silverText'
                                style={{ fontSize: fontSize.base }}>
                                {user?.email}
                            </Text>
                        </View>
                    </View>
                    <Pressable className='px-3 py-5 flex-row items-center gap-3 w-full border-b border-accent-light dark:border-accent-dark'>
                        <SquarePen
                            size={Math.min(fontSize["3xl"], 20)}
                            style={{
                                marginRight: 2,
                                marginBottom: -2,
                            }}
                            color={colorScheme === "dark" ? "#fff" : "#000"}
                        />
                        <Text
                            className='text-black dark:text-white'
                            style={{ fontSize: fontSize.base }}>
                            Edit profile
                        </Text>
                    </Pressable>
                    <Pressable
                        className='px-3 py-5 flex-row items-center gap-3 w-full'
                        onPress={() => logout()}>
                        <LogOut
                            size={Math.min(fontSize["3xl"], 20)}
                            style={{
                                marginRight: 2,
                                marginBottom: -2,
                            }}
                            color={colorScheme === "dark" ? "#fff" : "#000"}
                        />
                        <Text
                            className='text-black dark:text-white'
                            style={{ fontSize: fontSize.base }}>
                            Log Out
                        </Text>
                    </Pressable>
                </View>
                <View>
                    <Text className='font-bold text-black dark:text-white'>
                        Appearance
                    </Text>
                </View>
                <View>
                    <Text className='font-bold text-black dark:text-white'>
                        Switch bands
                    </Text>
                    <View className='flex-row'>
                        {options.map((opt) => (
                            <Pressable
                                key={opt.value}
                                onPress={() => setThemePreference(opt.value)}
                                className={`flex-1 py-2 rounded-lg items-center justify-center ${
                                    themePreference === opt.value
                                        ? "bg-accent-light dark:bg-accent-dark"
                                        : "bg-transparent"
                                }`}>
                                <Text
                                    className={`font-medium ${
                                        themePreference === opt.value
                                            ? "text-white"
                                            : "text-black dark:text-silverText"
                                    }`}
                                    style={{ fontSize: fontSize.base }}>
                                    {opt.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
                <View>
                    <Text className='font-bold text-black dark:text-white'>
                        Quick settings
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default profile;
