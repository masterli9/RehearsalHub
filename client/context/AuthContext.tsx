import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut,
    User as FirebaseUser,
    sendEmailVerification,
    deleteUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import apiUrl from "@/config";
import { Alert } from "react-native";
import { router } from "expo-router";

export type AppUser = {
    uid: string;
    email: string | null;
    username: string | null;
    photoURL: string | null;
    emailVerified: boolean;
};

type AuthContextType = {
    user: AppUser | null;
    loading: boolean;
    idToken: string | null;
    setIdToken: (idToken: string | null) => void;
    register: (
        email: string,
        password: string,
        username: string
    ) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    googleSignIn: (firebaseUser?: FirebaseUser) => Promise<void>;
    updateUser: (data: Partial<AppUser>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("UseAuth must be inside AuthProvider");
    return ctx;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [idToken, setIdToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch our custom user data from the backend
                    const response = await fetch(
                        `${apiUrl}/api/users/uid/${firebaseUser.uid}`
                    );
                    if (response.ok) {
                        const dbUser = await response.json();
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            username: dbUser.username,
                            photoURL: dbUser.photourl,
                            emailVerified: firebaseUser.emailVerified,
                        });
                    } else if (response.status === 404) {
                        // User not in our DB, could be a new Google sign-in
                        if (
                            firebaseUser.providerData.some(
                                (p) => p.providerId === "google.com"
                            )
                        ) {
                            await googleSignIn(firebaseUser); // This will now throw on failure
                        } else {
                            // Or a new email/pass registration in progress.
                            // For now, set a temporary user object. `register` will create the DB entry.
                            setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                username: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                emailVerified: firebaseUser.emailVerified,
                            });
                        }
                    } else {
                        console.error("Failed to fetch user data.");
                        // Throw to be caught by the outer catch, which will sign out.
                        throw new Error(
                            "Server error while fetching user data"
                        );
                    }

                    // If we successfully got or created the user, set the token.
                    const token = await firebaseUser.getIdToken();
                    setIdToken(token);
                } catch (error) {
                    console.error(
                        "Error during auth state processing, signing out:",
                        error
                    );
                    await signOut(auth);
                    setUser(null);
                    setIdToken(null);
                }
            } else {
                setUser(null);
                setIdToken(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const updateUser = (data: Partial<AppUser>) => {
        setUser((prevUser) => {
            if (!prevUser) return null;
            return { ...prevUser, ...data };
        });
    };

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

        try {
            // Send email verification - if this fails, we should still try to save to DB
            // but we'll handle the error gracefully
            try {
                await sendEmailVerification(cred.user);
            } catch (emailError) {
                console.error("Failed to send email verification:", emailError);
                // Continue with registration even if email send fails
                // The user can resend from the verification page
            }

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
                // Rollback: delete Firebase user if DB save fails
                try {
                    await deleteUser(cred.user);
                } catch (deleteError) {
                    console.error(
                        "Failed to delete Firebase user after DB error:",
                        deleteError
                    );
                }

                if (errorData.error === "Username is already taken") {
                    throw new Error("USERNAME_TAKEN");
                } else if (errorData.error === "User already exists") {
                    throw new Error("USER_EXISTS");
                } else {
                    throw new Error("REGISTRATION_FAILED");
                }
            } else {
                // After successful registration, update the user in context with DB data
                const dbUser = await response.json();
                setUser({
                    uid: cred.user.uid,
                    email: cred.user.email,
                    username: dbUser.username,
                    photoURL: dbUser.photourl,
                    emailVerified: cred.user.emailVerified,
                });
            }
        } catch (error) {
            // If any error occurs after Firebase user creation, try to clean up
            // (This handles cases where the error wasn't caught above)
            if (
                error instanceof Error &&
                error.message !== "USERNAME_TAKEN" &&
                error.message !== "USER_EXISTS" &&
                error.message !== "REGISTRATION_FAILED"
            ) {
                try {
                    await deleteUser(cred.user);
                } catch (deleteError) {
                    console.error(
                        "Failed to delete Firebase user after error:",
                        deleteError
                    );
                }
            }
            // Re-throw the error for UI handling
            throw error;
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
    const googleSignIn = async (firebaseUser?: FirebaseUser) => {
        const userToUse = firebaseUser || auth.currentUser;
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

            const dbUser = await response.json();
            console.log("Google user registered/fetched successfully:", dbUser);
            // Update user state with combined data
            setUser({
                uid: userToUse.uid,
                email: userToUse.email,
                username: dbUser.username,
                photoURL: dbUser.photourl,
                emailVerified: userToUse.emailVerified,
            });
        } catch (error) {
            console.error("Error registering Google user: ", error);
            // Re-throw to allow the caller (onAuthStateChanged) to handle the failure.
            throw error;
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.replace("/(auth)/auth");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                idToken,
                setIdToken,
                register,
                login,
                logout,
                googleSignIn,
                updateUser,
            }}>
            {children}
        </AuthContext.Provider>
    );
}
