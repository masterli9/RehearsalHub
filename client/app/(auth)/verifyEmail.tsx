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
            <Card className='flex-col items-center justify-center p-3 gap-2'>
                <Text
                    className='text-dark dark:text-white text-center font-regular my-3'
                    style={{ fontSize: fontSize["2xl"] }}>
                    Check your inbox to verify your email.
                </Text>
                <StyledButton
                    title='Resend email'
                    onPress={handleResend}
                    disabled={isDisabled}
                />
                <StyledButton title="I've verified" onPress={handleVerified} />
                <StyledButton
                    title='Back to Login'
                    onPress={async () => {
                        await logout();
                    }}
                />
            </Card>
        </PageContainer>
    );
}
