import {
    Image,
    Pressable,
    Text,
    TextInput,
    useColorScheme,
    View,
    Keyboard,
    TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // nebo react-native-linear-gradient
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import SwitchTabs from "@/components/SwitchTabs";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function Auth() {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState(systemScheme);
    const [activeTab, setActiveTab] = useState("Login");

    useEffect(() => {
        setTheme(systemScheme);
    }, [systemScheme]);
    return (
        <SafeAreaView className="flex-1">
            <LinearGradient
                colors={["rgba(172, 70, 255, 0.46)", "#0A0A0A"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                className="flex-1 items-center justify-center p-3"
            >
                <KeyboardAwareScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    contentContainerClassName="flex-1 items-center justify-center"
                    keyboardShouldPersistTaps="handled"
                    // extraScrollHeight={60} // Adjust this value as needed
                    enableOnAndroid={true}
                    enableAutomaticScroll={true}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View className="flex-col items-center justify-center bg-darkWhite dark:bg-boxBackground-dark w-full p-4 rounded-2xl">
                            <Text className="text-2xl font-bold text-black dark:text-white mt-3">
                                Welcome to RehearsalHub!
                            </Text>
                            <Text className="text-silverText font-regular text-base mb-4">
                                Log in to your account or create a new one.
                            </Text>
                            <SwitchTabs
                                tabs={["Login", "Register"]}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                className="mb-4"
                            />
                            {activeTab === "Login" ? (
                                <>
                                    <TextInput
                                        placeholder="Email"
                                        placeholderTextColor="#A1A1A1"
                                        className="w-full p-3 bg-white dark:bg-darkGray my-4 text-white rounded-m border border-accent-light dark:border-accent-dark"
                                    />
                                    <TextInput
                                        secureTextEntry
                                        placeholder="Password"
                                        placeholderTextColor="#A1A1A1"
                                        className="w-full p-3 bg-white dark:bg-darkGray mb-6 text-white rounded-m border border-accent-light dark:border-accent-dark"
                                    />
                                    <Pressable
                                        className="bg-black dark:bg-white rounded-m p-2 active:bg-accent-dark dark:active:bg-accent-light active:scale-95"
                                        onPress={() => {}}
                                    >
                                        <Text className="text-base font-bold text-white dark:text-black">
                                            Log in
                                        </Text>
                                    </Pressable>
                                </>
                            ) : (
                                <>
                                    <TextInput
                                        placeholder="Username"
                                        placeholderTextColor="#A1A1A1"
                                        className="w-full p-3 my-4 bg-white dark:bg-darkGray text-white rounded-m border border-accent-light dark:border-accent-dark"
                                    />
                                    <TextInput
                                        placeholder="Email"
                                        placeholderTextColor="#A1A1A1"
                                        className="w-full p-3 bg-white dark:bg-darkGray mb-4 text-white rounded-m border border-accent-light dark:border-accent-dark"
                                    />
                                    <TextInput
                                        secureTextEntry
                                        placeholder="Password"
                                        placeholderTextColor="#A1A1A1"
                                        className="w-full p-3 bg-white dark:bg-darkGray mb-6 text-white rounded-m border border-accent-light dark:border-accent-dark"
                                    />
                                    <TextInput
                                        secureTextEntry
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#A1A1A1"
                                        className="w-full p-3 bg-white dark:bg-darkGray mb-6 text-white rounded-m border border-accent-light dark:border-accent-dark"
                                    />
                                    <Pressable
                                        className="bg-black dark:bg-white rounded-m p-2 active:bg-accent-dark dark:active:bg-accent-light active:scale-95"
                                        onPress={() => {}}
                                    >
                                        <Text className="text-base font-bold text-white dark:text-black">
                                            Register
                                        </Text>
                                    </Pressable>
                                </>
                            )}
                            <View className="border-b border-accent-light dark:border-accent-dark my-4 w-full"></View>
                            <Pressable className="bg-darkGray w-full flex-row justify-center items-center p-3 rounded-m active:bg-accent-dark">
                                <Image
                                    source={{
                                        uri: "https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw",
                                    }}
                                    className="w-10 h-full"
                                    resizeMode="contain"
                                />
                                <Text className="text-white text-xl">
                                    Sign in with Google
                                </Text>
                            </Pressable>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAwareScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}
