import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut,
    User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

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
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
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
        await updateProfile(cred.user, { displayName: username });
    };
    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
