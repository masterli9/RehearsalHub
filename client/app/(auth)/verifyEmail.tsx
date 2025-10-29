import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Text, useColorScheme, View, Alert } from "react-native";
import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { useEffect } from "react";
import StyledButton from "@/components/StyledButton";

export default function VerifyEmail() {
    const systemScheme = useColorScheme();
    const [resendDisabledUntil, setResendDisabledUntil] = useState<
        number | null
    >(null);
    const { user } = useAuth();

    const COOLDOWN_MS = 30 * 1000;
    const [isDisabled, setIsDisabled] = useState(false);

    useEffect(() => {
        if (resendDisabledUntil === null) {
            setIsDisabled(false);
            return;
        }
        const tick = () => {
            if (Date.now() < resendDisabledUntil) {
                setIsDisabled(true);
            } else {
                setIsDisabled(false);
                setResendDisabledUntil(null);
            }
        };

        tick();
        if (Date.now() < resendDisabledUntil) {
            const interval = setInterval(tick, 500);
            return () => clearInterval(interval);
        }
    }, [resendDisabledUntil]);

    const handleResend = async () => {
        if (!user) return;
        if (isDisabled) {
            Alert.alert("Please wait", "You can resend email in a few seconds");
            return;
        }
        try {
            await sendEmailVerification(user);
            setResendDisabledUntil(Date.now() + COOLDOWN_MS);
            Alert.alert("Verification email sent", "Check your inbox again.");
        } catch (error) {
            console.error("Failed to resend verification email: ", error);
            Alert.alert("Error", "Failed to send email, try again later.");
        }
    };
    const handleVerified = async () => {
        if (!user) return;
        await user.reload();
        if (user.emailVerified) {
            router.replace("/(tabs)");
        } else {
            Alert.alert(
                "Still not verified.",
                "Please verify your email first."
            );
        }
    };

    return (
        <LinearGradient
            colors={
                systemScheme === "dark"
                    ? ["rgba(172, 70, 255, 0.46)", "#0A0A0A"]
                    : ["rgba(172, 70, 255, 0.46)", "#ffffffff"]
            }
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            className='flex-1 items-center justify-center p-3'>
            <SafeAreaView>
                <View className='flex-col items-center justify-center p-3 bg-darkWhite dark:bg-boxBackground-dark gap-2 rounded-2xl'>
                    <Text className='text-dark dark:text-white text-center text-2xl font-regular my-3'>
                        Check your inbox to verify your email.
                    </Text>
                    <StyledButton
                        title='Resend email'
                        onPress={handleResend}
                        disabled={isDisabled}
                    />
                    <StyledButton
                        title="I've verified"
                        onPress={handleVerified}
                    />
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}
