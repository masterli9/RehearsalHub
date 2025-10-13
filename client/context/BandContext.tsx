import { createContext, useContext, useEffect, useState } from "react";
import apiUrl from "@/config";
import { useAuth } from "./AuthContext";

type Band = {
    id: string;
    name: string;
    inviteCode: string;
};

type BandContextType = {
    bands: Band[];
    activeBand: Band | null;
    switchBand: (id: string) => void;
    createBand: (name: string) => Promise<void>;
    joinBandByCode: (code: string) => Promise<void>;
    fetchUserBands: (uid: string) => Promise<void>;
};

const BandContext = createContext<BandContextType | undefined>(undefined);

export const BandProvider = ({ children }: { children: React.ReactNode }) => {
    const [bands, setBands] = useState<Band[]>([]);
    const [activeBand, setActiveBand] = useState<Band | null>(null);

    const { user } = useAuth();

    useEffect(() => {
        const mockBands = [
            { id: "1", name: "My First Band", inviteCode: "ABC123" },
            { id: "2", name: "Side Project", inviteCode: "XYZ789" },
        ];
        setBands(mockBands);
        setActiveBand(mockBands[0]);
    }, []);

    const switchBand = (id: string) => {
        const found = bands.find((b) => b.id === id) || null;
        setActiveBand(found);
    };

    const fetchUserBands = async (uid: string) => {
        try {
            const res = await fetch(`${apiUrl}/api/users/${uid}/bands`);
            const data = await res.json();

            console.log("fetchUserBands response:", {
                status: res.status,
                ok: res.ok,
                data,
            });

            if (!res.ok) {
                console.warn("API error while loading bands: ", data);
                setBands([]);
                setActiveBand(null);
                return;
            }

            const safe = Array.isArray(data)
                ? data
                : data?.rows && Array.isArray(data.rows)
                  ? data.rows
                  : [];
            setBands(safe);
            setActiveBand(safe[0] || null);
        } catch (err) {
            console.error("Error in fetchUserBands:", err);
            setBands([]);
            setActiveBand(null);
        }
    };

    const createBand = async (name: string) => {
        try {
            const userId = user?.uid || "demo_user";

            const res = await fetch(`${apiUrl}/api/bands`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, creator_id: userId }),
            });

            if (!res.ok) throw new Error("Error creating band (fe)");

            const newBand = await res.json();
            setBands((prev) => [...prev, newBand]);
            setActiveBand(newBand);
        } catch (err) {
            console.error("createBand error: ", err);
        }
    };

    const joinBandByCode = async (code: string) => {
        try {
            const userId = user?.uid || "demo_user";

            const res = await fetch(`${apiUrl}/api/bands/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invite_code: code, user_id: userId }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Error joining band (fe)");
                return;
            }

            setBands((prev) => [...prev, data]);
            setActiveBand(data);
        } catch (err) {
            console.error("joinBandByCode error:", err);
        }
    };

    return (
        <BandContext.Provider
            value={{
                bands,
                activeBand,
                switchBand,
                createBand,
                joinBandByCode,
                fetchUserBands,
            }}
        >
            {children}
        </BandContext.Provider>
    );
};

export const useBand = () => {
    const context = useContext(BandContext);
    if (!context) {
        throw new Error("useVand has to be called inside BandProvider");
    }
    return context;
};
