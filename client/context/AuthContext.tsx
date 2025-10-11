import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut,
    User,
    sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import apiUrl from "@/config";
import { Alert } from "react-native";
import { router } from "expo-router";

type AuthContextType = {
    user: User | null;
    loading: boolean;
    register: (
        email: string,
        password: string,
        username: string
    ) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("UseAuth must be inside AuthProvider");
    return ctx;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            // if (firebaseUser) {
            //     await firebaseUser.reload();
            //     if (!firebaseUser.emailVerified) {
            //         router.replace("/(auth)/verifyEmail");
            //     }
            // }
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const register = async (
        email: string,
        password: string,
        username: string
    ) => {
        const cred = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        await sendEmailVerification(cred.user);
        await updateProfile(cred.user, { displayName: username });
        try {
            await fetch(apiUrl + "/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: cred.user.uid,
                    email: email,
                    username: username,
                }),
            });
        } catch (error) {
            console.error("Failed to create user in backend: ", error);
        }
    };
    const login = async (email: string, password: string) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);

        if (!cred.user.emailVerified) {
            Alert.alert(
                "Email not verified",
                "Please verify your email before logging in.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.replace("/(auth)/verifyEmail");
                        },
                    },
                ]
            );
            return;
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.replace("/(auth)/auth");
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
