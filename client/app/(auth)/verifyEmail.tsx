import { Text, View, Alert } from "react-native";
import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { useEffect } from "react";
import StyledButton from "@/components/StyledButton";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { auth } from "@/lib/firebase";

export default function VerifyEmail() {
    const [resendDisabledUntil, setResendDisabledUntil] = useState<
        number | null
    >(null);
    const { user, logout } = useAuth();
    const fontSize = useAccessibleFontSize();

    const COOLDOWN_MS = 30 * 1000;
    const [isDisabled, setIsDisabled] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (resendDisabledUntil === null) {
            setIsDisabled(false);
            return;
        }
        const tick = () => {
            const timeLeft = Math.max(
                0,
                Math.floor((resendDisabledUntil - Date.now()) / 1000)
            );
            setSecondsLeft(timeLeft);
            if (timeLeft === 0) {
                setIsDisabled(false);
                setResendDisabledUntil(null);
            } else {
                setIsDisabled(true);
            }
        };

        tick();
        if (resendDisabledUntil && Date.now() < resendDisabledUntil) {
            const interval = setInterval(tick, 1000);
            return () => clearInterval(interval);
        }
    }, [resendDisabledUntil]);
    useEffect(() => {
        setResendDisabledUntil(Date.now() + COOLDOWN_MS);
        setIsDisabled(true);
    }, []);

    const handleResend = async () => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            Alert.alert("Error", "No user found. Please try logging in again.");
            return;
        }
        if (isDisabled) {
            Alert.alert("Please wait", "You can resend email in a few seconds");
            return;
        }
        try {
            await sendEmailVerification(firebaseUser);
            setResendDisabledUntil(Date.now() + COOLDOWN_MS);
            Alert.alert("Verification email sent", "Check your inbox again.");
        } catch (error) {
            console.error("Failed to resend verification email: ", error);
            Alert.alert("Error", "Failed to send email, try again later.");
        }
    };
    const handleVerified = async () => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            Alert.alert("Error", "No user found. Please try logging in again.");
            return;
        }
        try {
            await firebaseUser.reload();
            if (firebaseUser.emailVerified) {
                router.replace("/(tabs)");
            } else {
                Alert.alert(
                    "Still not verified.",
                    "Please verify your email first."
                );
            }
        } catch (error) {
            console.error("Error checking verification status: ", error);
            Alert.alert(
                "Error",
                "Failed to check verification status. Please try again."
            );
        }
    };

    return (
        <PageContainer centered>
            <Card className='flex-col items-center justify-center p-6 gap-4 w-full max-w-md'>
                <View className='flex-col items-center justify-center gap-2 mb-2'>
                    <Text
                        className='text-dark dark:text-white text-center font-bold'
                        style={{ fontSize: fontSize["2xl"] }}>
                        Check your inbox
                    </Text>
                    <Text
                        className='text-silverText text-center font-regular'
                        style={{ fontSize: fontSize.base }}>
                        We've sent a verification email to your inbox. Please
                        verify your email to continue.
                    </Text>
                </View>

                <View className='w-full gap-3 mt-2'>
                    <StyledButton
                        title="I've verified my email"
                        onPress={handleVerified}
                        className='w-full'
                    />
                </View>

                <View className='w-full border-t border-accent-light dark:border-accent-dark pt-4 mt-2'>
                    <View className='flex-col items-center justify-center gap-2 mb-3'>
                        <Text
                            className='text-silverText text-center'
                            style={{ fontSize: fontSize.sm }}>
                            Didn't receive the email?
                        </Text>
                    </View>
                    <StyledButton
                        title={
                            isDisabled && secondsLeft > 0
                                ? `Resend email (${secondsLeft}s)`
                                : "Resend email"
                        }
                        onPress={handleResend}
                        disabled={isDisabled}
                        variant='accent'
                        className='w-full'
                    />
                </View>

                <View className='w-full border-t border-accent-light dark:border-accent-dark pt-4 mt-2'>
                    <StyledButton
                        title='Back to Login'
                        onPress={async () => {
                            await logout();
                        }}
                        variant='accent'
                        className='w-full'
                    />
                </View>
            </Card>
        </PageContainer>
    );
}
