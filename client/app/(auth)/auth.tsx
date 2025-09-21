import {
    Image,
    Pressable,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // nebo react-native-linear-gradient
import { useEffect, useState } from "react";

export default function Auth() {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState(systemScheme);
    const [isLogin, setIsLogin] = useState(true);

    useEffect(() => {
        setTheme(systemScheme);
    }, [systemScheme]);
    return (
        <LinearGradient
            colors={["rgba(172, 70, 255, 0.46)", "#0A0A0A"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            className='flex-1 items-center justify-center p-3'>
            <View className='flex-col items-center justify-center bg-darkWhite dark:bg-boxBackground-dark w-full p-4 rounded-2xl'>
                <Text className='text-2xl font-bold text-black dark:text-white mt-3'>
                    Welcome to RehearsalHub!
                </Text>
                <Text className='text-silverText font-regular text-base mb-4'>
                    Log in to your account or create a new one.
                </Text>
                <View className='rounded-m w-full flex-row p-2 bg-accent-light dark:bg-accent-dark my-3'>
                    <Pressable className='bg-boxBackground-light dark:bg-boxBackground-dark p-3 rounded-m w-1/2 shadow'>
                        <Text className='text-black dark:text-white text-base'>
                            Login
                        </Text>
                    </Pressable>
                    <Pressable className='p-3 rounded-m w-1/2'>
                        <Text className='text-silverText text-base'>
                            Register
                        </Text>
                    </Pressable>
                </View>
                <TextInput
                    placeholder='Email'
                    className='w-full bg-white dark:bg-darkGray my-4 text-white rounded-m border border-accent-light dark:border-accent-dark'
                />
                <TextInput
                    secureTextEntry
                    placeholder='Password'
                    className='w-full bg-white dark:bg-darkGray mb-6 text-white rounded-m border border-accent-light dark:border-accent-dark'
                />
                <Pressable
                    className='bg-black dark:bg-white rounded-m p-2'
                    onPress={() => {}}>
                    <Text className='text-base font-bold text-white dark:text-black'>
                        Log in
                    </Text>
                </Pressable>
                <View className='border-b border-accent-light dark:border-accent-dark my-4 w-full'></View>
                <Pressable className='bg-darkGray w-full flex-row justify-center items-center p-3 rounded-m'>
                    <Image
                        source={{
                            uri: "https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw",
                        }}
                        className='w-10 h-full'
                        resizeMode='contain'
                    />
                    <Text className='text-white text-xl'>
                        Sign in with Google
                    </Text>
                </Pressable>
            </View>
        </LinearGradient>
    );
}
