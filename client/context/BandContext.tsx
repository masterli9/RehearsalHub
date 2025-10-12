import { createContext, useContext, useEffect, useState } from "react";
import apiUrl from "@/config";

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
            setBands(data);
            setActiveBand(data[0] || null);
        } catch (error) {
            console.error("Error while loading bands (fe): ", error);
        }
    };

    const createBand = async (name: string) => {
        try {
            // TODO: nahraď userId aktuálním Firebase UID
            const userId = "demo_user";

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
            const userId = "demo_user";

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
            }}>
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
