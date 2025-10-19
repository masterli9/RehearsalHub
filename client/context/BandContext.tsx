import { createContext, useContext, useEffect, useState } from "react";
import apiUrl from "@/config";
import { useAuth } from "./AuthContext";

type Band = {
    id: string;
    name: string;
    inviteCode: string;
};
export type BandRole = {
    role_id: number;
    title: string;
};

type BandContextType = {
    bands: Band[];
    activeBand: Band | null;
    switchBand: (id: string) => void;
    createBand: (name: string) => Promise<void>;
    joinBandByCode: (code: string, role: BandRole[]) => Promise<void>;
    fetchUserBands: (uid: string) => Promise<void>;
    fetchBandMembers: (bandId: string) => Promise<any[]>;
};

const BandContext = createContext<BandContextType | undefined>(undefined);

export const BandProvider = ({ children }: { children: React.ReactNode }) => {
    const [bands, setBands] = useState<Band[]>([]);
    const [activeBand, setActiveBand] = useState<Band | null>(null);

    const { user } = useAuth();

    // Removed mock bands - let the real API calls handle band data

    const switchBand = (id: string) => {
        const found = bands.find((b) => b.id === id) || null;
        setActiveBand(found);
    };

    const fetchUserBands = async (uid: string) => {
        try {
            const res = await fetch(`${apiUrl}/api/users/${uid}/bands`);
            const data = await res.json();

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

            const mapped = safe.map((b: any) => ({
                id: b.band_id || b.id,
                name: b.name,
                inviteCode: b.invite_code || b.inviteCode,
            }));

            setBands(mapped);
            setActiveBand(mapped[0] || null);
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

            const data = await res.json();

            const newBand = {
                id: data.band_id || data.id,
                name: data.name,
                inviteCode: data.invite_code || data.inviteCode,
            };

            setBands((prev) => [...prev, newBand]);
            setActiveBand(newBand);
        } catch (err) {
            console.error("createBand error: ", err);
        }
    };

    const joinBandByCode = async (code: string, roles: BandRole[]) => {
        try {
            const userId = user?.uid || "demo_user";

            const res = await fetch(`${apiUrl}/api/bands/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invite_code: code,
                    user_id: userId,
                    roles: roles,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Error joining band (fe)");
                return;
            }

            const joined = {
                id: data.band_id || data.id,
                name: data.name,
                inviteCode: data.invite_code || data.inviteCode,
            };

            setBands((prev) => [...prev, joined]);
            setActiveBand(joined);
        } catch (err) {
            console.error("joinBandByCode error:", err);
        }
    };
    const fetchBandMembers = async (bandId: string) => {
        if (!bandId) {
            console.warn("fetchBandMembers called with empty bandId");
            return [];
        }

        try {
            const res = await fetch(`${apiUrl}/api/bands/${bandId}/members`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            return data; // array of members
        } catch (err) {
            console.error("fetchBandMembers error:", err);
            return [];
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
                fetchBandMembers,
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
