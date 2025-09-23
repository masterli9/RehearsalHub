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
import { Formik } from "formik";
import * as Yup from "yup";

export default function Auth() {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState(systemScheme);
    const [activeTab, setActiveTab] = useState("Login");

    const loginSchema = Yup.object().shape({
        email: Yup.string()
            .email("Invalid email")
            .max(255, "Email is too long.")
            .required("Email is required"),
        password: Yup.string()
            .min(8, "Password must be atleast 8 characters")
            .max(255, "Password is too long.")
            .required("Password is required"),
    });
    const registerSchema = Yup.object().shape({
        username: Yup.string()
            .min(3, "Username must be atleast 3 characters")
            .max(30, "Username is too long.")
            .required("Username is required"),
        email: Yup.string()
            .email("Invalid email")
            .max(255, "Email is too long.")
            .required("Email is required"),
        password: Yup.string()
            .min(8, "Password must be atleast 8 characters")
            .max(255, "Password is too long.")
            .required("Password is required"),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref("password")], "Passwords must match")
            .required("Required"),
    });

    useEffect(() => {
        setTheme(systemScheme);
    }, [systemScheme]);
    return (
        <SafeAreaView className="flex-1">
            <LinearGradient
                colors={
                    theme === "dark"
                        ? ["rgba(172, 70, 255, 0.46)", "#0A0A0A"]
                        : ["rgba(172, 70, 255, 0.46)", "#ffffffff"]
                }
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                className="flex-1 items-center justify-center p-3"
            >
                <KeyboardAwareScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    contentContainerClassName="items-center justify-center"
                    keyboardShouldPersistTaps="handled"
                    extraScrollHeight={100}
                    enableOnAndroid={true}
                    enableAutomaticScroll={true}
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        key={activeTab}
                        className="flex-col items-center justify-center bg-darkWhite dark:bg-boxBackground-dark w-full p-4 rounded-2xl"
                    >
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
                            <Formik
                                key="login"
                                initialValues={{ email: "", password: "" }}
                                validationSchema={loginSchema}
                                onSubmit={(values) => {
                                    console.log(values);
                                }}
                                validateOnBlur={false}
                                validateOnChange={false}
                            >
                                {({
                                    handleChange,
                                    handleBlur,
                                    handleSubmit,
                                    values,
                                    errors,
                                    touched,
                                    submitCount,
                                }) => (
                                    <>
                                        <TextInput
                                            placeholder="Email"
                                            placeholderTextColor="#A1A1A1"
                                            className="w-full p-3 bg-white dark:bg-darkGray my-4 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark"
                                            value={values.email}
                                            onChangeText={handleChange("email")}
                                            onBlur={handleBlur("email")}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                        {(touched.email || submitCount > 0) &&
                                            errors.email && (
                                                <Text className="text-red-500 mb-3">
                                                    {errors.email}
                                                </Text>
                                            )}
                                        <TextInput
                                            secureTextEntry
                                            placeholder="Password"
                                            placeholderTextColor="#A1A1A1"
                                            className="w-full p-3 bg-white dark:bg-darkGray mb-6 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark"
                                            value={values.password}
                                            onChangeText={handleChange(
                                                "password"
                                            )}
                                            onBlur={handleBlur("password")}
                                            keyboardType="numbers-and-punctuation"
                                            autoCapitalize="none"
                                        />
                                        {(touched.password ||
                                            submitCount > 0) &&
                                            errors.password && (
                                                <Text className="text-red-500 mb-3">
                                                    {errors.password}
                                                </Text>
                                            )}
                                        <Pressable
                                            className="bg-black dark:bg-white rounded-m p-2 active:bg-accent-dark dark:active:bg-accent-light active:scale-95"
                                            onPress={() => handleSubmit()}
                                        >
                                            <Text className="text-base font-bold text-white dark:text-black">
                                                Log in
                                            </Text>
                                        </Pressable>
                                    </>
                                )}
                            </Formik>
                        ) : (
                            <Formik
                                key="register"
                                initialValues={{
                                    username: "",
                                    email: "",
                                    password: "",
                                    confirmPassword: "",
                                }}
                                validationSchema={registerSchema}
                                onSubmit={(values) => {
                                    console.log(values);
                                }}
                                validateOnBlur={false}
                                validateOnChange={false}
                            >
                                {({
                                    handleChange,
                                    handleBlur,
                                    handleSubmit,
                                    values,
                                    errors,
                                    touched,
                                    submitCount,
                                }) => (
                                    <>
                                        <TextInput
                                            placeholder="Username"
                                            placeholderTextColor="#A1A1A1"
                                            className="w-full p-3 my-4 bg-white dark:bg-darkGray text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark"
                                            value={values.username}
                                            onChangeText={handleChange(
                                                "username"
                                            )}
                                            onBlur={handleBlur("username")}
                                        />
                                        {(touched.username ||
                                            submitCount > 0) &&
                                            errors.username && (
                                                <Text className="text-red-500 mb-3">
                                                    {errors.username}
                                                </Text>
                                            )}
                                        <TextInput
                                            placeholder="Email"
                                            placeholderTextColor="#A1A1A1"
                                            className="w-full p-3 bg-white dark:bg-darkGray mb-4 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark"
                                            value={values.email}
                                            onChangeText={handleChange("email")}
                                            onBlur={handleBlur("email")}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                        {(touched.email || submitCount > 0) &&
                                            errors.email && (
                                                <Text className="text-red-500 mb-3">
                                                    {errors.email}
                                                </Text>
                                            )}
                                        <TextInput
                                            secureTextEntry
                                            placeholder="Password"
                                            placeholderTextColor="#A1A1A1"
                                            className="w-full p-3 bg-white dark:bg-darkGray mb-4 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark"
                                            value={values.password}
                                            onChangeText={handleChange(
                                                "password"
                                            )}
                                            onBlur={handleBlur("password")}
                                            keyboardType="numbers-and-punctuation"
                                            autoCapitalize="none"
                                        />
                                        {(touched.password ||
                                            submitCount > 0) &&
                                            errors.password && (
                                                <Text className="text-red-500 mb-3">
                                                    {errors.password}
                                                </Text>
                                            )}
                                        <TextInput
                                            secureTextEntry
                                            placeholder="Confirm Password"
                                            placeholderTextColor="#A1A1A1"
                                            className="w-full p-3 bg-white dark:bg-darkGray mb-6 text-black dark:text-white rounded-m border border-accent-light dark:border-accent-dark"
                                            value={values.confirmPassword}
                                            onChangeText={handleChange(
                                                "confirmPassword"
                                            )}
                                            onBlur={handleBlur(
                                                "confirmPassword"
                                            )}
                                            keyboardType="numbers-and-punctuation"
                                            autoCapitalize="none"
                                        />
                                        {(touched.confirmPassword ||
                                            submitCount > 0) &&
                                            errors.confirmPassword && (
                                                <Text className="text-red-500 mb-3">
                                                    {errors.confirmPassword}
                                                </Text>
                                            )}
                                        <Pressable
                                            className="bg-black dark:bg-white rounded-m p-2 active:bg-accent-dark dark:active:bg-accent-light active:scale-95"
                                            onPress={() => {
                                                handleSubmit();
                                            }}
                                        >
                                            <Text className="text-base font-bold text-white dark:text-black">
                                                Register
                                            </Text>
                                        </Pressable>
                                    </>
                                )}
                            </Formik>
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
                </KeyboardAwareScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}
