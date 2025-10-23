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
    googleSignIn: (firebaseUser?: User) => Promise<void>;
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

            // If user signed in with Google (has photoURL and providerData), register them
            if (
                firebaseUser &&
                firebaseUser.photoURL &&
                firebaseUser.providerData.some(
                    (provider) => provider.providerId === "google.com"
                )
            ) {
                console.log("Google user detected, registering in database...");
                await googleSignIn(firebaseUser);
            }
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

        const response = await fetch(apiUrl + "/api/users", {
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

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error === "Username is already taken") {
                throw new Error("USERNAME_TAKEN");
            } else if (errorData.error === "User already exists") {
                throw new Error("USER_EXISTS");
            } else {
                throw new Error("REGISTRATION_FAILED");
            }
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
    const googleSignIn = async (firebaseUser?: User) => {
        const userToUse = firebaseUser || user;
        if (!userToUse) {
            console.log("No user found, skipping database registration");
            return;
        }
        const payload = {
            uid: userToUse.uid,
            email: userToUse.email ?? "",
            username:
                userToUse.displayName ?? "User_" + userToUse.uid.slice(0, 6),
            photo_url: userToUse.photoURL ?? null,
        };
        try {
            console.log("Attempting to register Google user:", payload);
            const response = await fetch(`${apiUrl}/api/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(
                    "Server error registering Google user:",
                    errorData
                );
                throw new Error(
                    `Registration failed: ${errorData.error || "Unknown error"}`
                );
            }

            const result = await response.json();
            console.log("Google user registered successfully:", result);
        } catch (error) {
            console.error("Error registering Google user: ", error);
            // Don't throw the error to prevent breaking the auth flow
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.replace("/(auth)/auth");
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, register, login, logout, googleSignIn }}
        >
            {children}
        </AuthContext.Provider>
    );
}
