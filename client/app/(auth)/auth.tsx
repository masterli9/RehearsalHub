import { Text, View } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import SwitchTabs from "@/components/SwitchTabs";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Formik } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/context/AuthContext";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import StyledButton from "@/components/StyledButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/use-color-scheme";
import StyledTextInput from "@/components/StyledTextInput";
import ErrorText from "@/components/ErrorText";
import Card from "@/components/Card";

export default function Auth() {
    const [activeTab, setActiveTab] = useState("Login");
    const systemScheme = useColorScheme();

    const { login, register } = useAuth();

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
            .min(8, "Password must be at least 8 characters")
            .max(255, "Password is too long.")
            .matches(
                /[a-z]/,
                "Password must contain at least one lowercase letter"
            )
            .matches(
                /[A-Z]/,
                "Password must contain at least one uppercase letter"
            )
            .matches(/[0-9]/, "Password must contain at least one number")
            .matches(
                /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/,
                "Password must contain at least one special character"
            )
            .required("Password is required"),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref("password")], "Passwords must match")
            .required("Required"),
    });

    return (
        <SafeAreaView className='flex-1'>
            <LinearGradient
                colors={
                    systemScheme === "dark"
                        ? ["rgba(172, 70, 255, 0.46)", "#0A0A0A"]
                        : ["rgba(172, 70, 255, 0.46)", "#ffffffff"]
                }
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                className='flex-1 items-center justify-center p-3'>
                <KeyboardAwareScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    contentContainerClassName='items-center justify-center'
                    keyboardShouldPersistTaps='handled'
                    extraScrollHeight={100}
                    enableOnAndroid={true}
                    enableAutomaticScroll={true}
                    showsVerticalScrollIndicator={false}>
                    <Card
                        key={activeTab}
                        className='flex-col items-center justify-center w-full p-4'>
                        <Text className='text-2xl font-bold text-black dark:text-white mt-3'>
                            Welcome to RehearsalHub!
                        </Text>
                        <Text className='text-silverText font-regular text-base mb-4'>
                            Log in to your account or create a new one.
                        </Text>
                        <SwitchTabs
                            tabs={["Login", "Register"]}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            className='mb-4'
                        />
                        {activeTab === "Login" ? (
                            <Formik
                                key='login'
                                initialValues={{ email: "", password: "" }}
                                validationSchema={loginSchema}
                                onSubmit={async (
                                    values,
                                    { setSubmitting, setErrors }
                                ) => {
                                    try {
                                        await login(
                                            values.email,
                                            values.password
                                        );
                                        router.replace("/(tabs)");
                                    } catch (err) {
                                        setErrors({
                                            email: "Login failed. Check your email/password.",
                                        });
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                                validateOnBlur={false}
                                validateOnChange={false}>
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
                                        <StyledTextInput
                                            placeholder='Email'
                                            className='my-4'
                                            value={values.email}
                                            onChangeText={handleChange("email")}
                                            onBlur={handleBlur("email")}
                                            keyboardType='email-address'
                                            autoCapitalize='none'
                                        />
                                        {(touched.email || submitCount > 0) &&
                                            errors.email && (
                                                <ErrorText>
                                                    {errors.email}
                                                </ErrorText>
                                            )}
                                        <StyledTextInput
                                            secureTextEntry
                                            placeholder='Password'
                                            className='mb-6'
                                            value={values.password}
                                            onChangeText={handleChange(
                                                "password"
                                            )}
                                            onBlur={handleBlur("password")}
                                            keyboardType='numbers-and-punctuation'
                                            autoCapitalize='none'
                                        />
                                        {(touched.password ||
                                            submitCount > 0) &&
                                            errors.password && (
                                                <ErrorText>
                                                    {errors.password}
                                                </ErrorText>
                                            )}
                                        <StyledButton
                                            title='Log in'
                                            onPress={() => handleSubmit()}
                                        />
                                    </>
                                )}
                            </Formik>
                        ) : (
                            <Formik
                                key='register'
                                initialValues={{
                                    username: "",
                                    email: "",
                                    password: "",
                                    confirmPassword: "",
                                }}
                                validationSchema={registerSchema}
                                onSubmit={async (
                                    values,
                                    { setSubmitting, setErrors }
                                ) => {
                                    try {
                                        await register(
                                            values.email,
                                            values.password,
                                            values.username
                                        );

                                        router.replace("/(auth)/verifyEmail");
                                    } catch (err) {
                                        if (
                                            (err as { message: string })
                                                .message === "USERNAME_TAKEN"
                                        ) {
                                            setErrors({
                                                username:
                                                    "This username is already taken",
                                            });
                                        } else if (
                                            (err as { message: string })
                                                .message === "USER_EXISTS"
                                        ) {
                                            setErrors({
                                                email: "Registration failed. Try a different email.",
                                            });
                                        } else {
                                            setErrors({
                                                email: "Registration failed. Try a different email.",
                                            });
                                        }
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                                validateOnBlur={false}
                                validateOnChange={false}>
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
                                        <StyledTextInput
                                            placeholder='Username'
                                            className='my-4'
                                            value={values.username}
                                            onChangeText={handleChange(
                                                "username"
                                            )}
                                            onBlur={handleBlur("username")}
                                        />
                                        {(touched.username ||
                                            submitCount > 0) &&
                                            errors.username && (
                                                <ErrorText>
                                                    {errors.username}
                                                </ErrorText>
                                            )}
                                        <StyledTextInput
                                            placeholder='Email'
                                            className='mb-4'
                                            value={values.email}
                                            onChangeText={handleChange("email")}
                                            onBlur={handleBlur("email")}
                                            keyboardType='email-address'
                                            autoCapitalize='none'
                                        />
                                        {(touched.email || submitCount > 0) &&
                                            errors.email && (
                                                <ErrorText>
                                                    {errors.email}
                                                </ErrorText>
                                            )}
                                        <StyledTextInput
                                            secureTextEntry
                                            placeholder='Password'
                                            className='mb-4'
                                            value={values.password}
                                            onChangeText={handleChange(
                                                "password"
                                            )}
                                            onBlur={handleBlur("password")}
                                            keyboardType='numbers-and-punctuation'
                                            autoCapitalize='none'
                                        />
                                        {(touched.password ||
                                            submitCount > 0) &&
                                            errors.password && (
                                                <ErrorText>
                                                    {errors.password}
                                                </ErrorText>
                                            )}
                                        <StyledTextInput
                                            secureTextEntry
                                            placeholder='Confirm Password'
                                            className='mb-6'
                                            value={values.confirmPassword}
                                            onChangeText={handleChange(
                                                "confirmPassword"
                                            )}
                                            onBlur={handleBlur(
                                                "confirmPassword"
                                            )}
                                            keyboardType='numbers-and-punctuation'
                                            autoCapitalize='none'
                                        />
                                        {(touched.confirmPassword ||
                                            submitCount > 0) &&
                                            errors.confirmPassword && (
                                                <ErrorText>
                                                    {errors.confirmPassword}
                                                </ErrorText>
                                            )}
                                        <StyledButton
                                            title='Register'
                                            onPress={() => {
                                                handleSubmit();
                                            }}
                                        />
                                    </>
                                )}
                            </Formik>
                        )}
                        <View className='border-b border-accent-light dark:border-accent-dark my-4 w-full'></View>
                        <GoogleSignInButton className='bg-darkGray w-full flex-row justify-center items-center p-3 rounded-m active:bg-accent-dark' />
                    </Card>
                </KeyboardAwareScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}
