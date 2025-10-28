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
    createBand: (name: string, roles: BandRole[]) => Promise<void>;
    joinBandByCode: (code: string, role: BandRole[]) => Promise<void>;
    fetchUserBands: (uid: string) => Promise<void>;
    fetchBandMembers: (
        bandId: string
    ) => Promise<{ members: any[]; currentUserRoles: string[] }>;
    removeBand: (bandId: string) => void;
    removeBandMember: (bandId: string, firebaseUid: string) => Promise<void>;
    makeLeader: (bandId: string, newLeaderFirebaseUid: string) => Promise<void>;
};

const BandContext = createContext<BandContextType | undefined>(undefined);

export const BandProvider = ({ children }: { children: React.ReactNode }) => {
    const [bands, setBands] = useState<Band[]>([]);
    const [activeBand, setActiveBand] = useState<Band | null>(null);

    const { user } = useAuth();

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

    const createBand = async (name: string, roles: BandRole[]) => {
        try {
            const userId = user?.uid || "demo_user";

            const res = await fetch(`${apiUrl}/api/bands`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    creator_id: userId,
                    roles: roles,
                }),
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
            return { members: [], currentUserRoles: [] };
        }

        try {
            const userId = user?.uid || "demo_user";
            const res = await fetch(
                `${apiUrl}/api/bands/${bandId}/members?user_id=${userId}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            return {
                members: data.members,
                currentUserRoles: data.currentUserRoles,
            };
        } catch (err) {
            console.error("fetchBandMembers error:", err);
            return { members: [], currentUserRoles: [] };
        }
    };

    const removeBand = (bandId: string) => {
        setBands((prev) => {
            const remainingBands = prev.filter((band) => band.id !== bandId);

            // If the removed band was the active band, switch to the first remaining band or null
            if (activeBand?.id === bandId) {
                setActiveBand(
                    remainingBands.length > 0 ? remainingBands[0] : null
                );
            }

            return remainingBands;
        });
    };

    const removeBandMember = async (bandId: string, firebaseUid: string) => {
        try {
            const response = await fetch(
                `${apiUrl}/api/bands/${bandId}/remove-member/${firebaseUid}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!response.ok) {
                throw new Error("Failed to remove member");
            }

            const data = await response.json();

            // Check if the removed member is the current user
            if (firebaseUid === user?.uid) {
                // If removing yourself, remove the band from your bands list
                removeBand(bandId);
            }

            // If the band was deleted (no more members), remove it from the bands list
            if (data.bandDeleted) {
                removeBand(bandId);
            }

            // Note: For removing other members, the UI will handle updating the member list
            // since it has direct access to the member state
        } catch (error) {
            console.error("Error removing member:", error);
            throw error; // Re-throw so the UI can handle the error
        }
    };

    const makeLeader = async (bandId: string, newLeaderFirebaseUid: string) => {
        try {
            const currentUserId = user?.uid;
            if (!currentUserId) {
                throw new Error("User not authenticated");
            }

            // Remove current user's leader role first
            const removeResponse = await fetch(
                `${apiUrl}/api/bands/${bandId}/remove-leader/${currentUserId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!removeResponse.ok) {
                const errorData = await removeResponse.json();
                throw new Error(
                    errorData.error || "Failed to remove leader role"
                );
            }

            // Make the new user a leader
            const makeResponse = await fetch(
                `${apiUrl}/api/bands/${bandId}/make-leader/${newLeaderFirebaseUid}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!makeResponse.ok) {
                const errorData = await makeResponse.json();
                // Try to restore leader role to current user
                await fetch(
                    `${apiUrl}/api/bands/${bandId}/make-leader/${currentUserId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
                throw new Error(errorData.error || "Failed to make leader");
            }
        } catch (error) {
            console.error("Error making leader:", error);
            throw error;
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
                removeBand,
                removeBandMember,
                makeLeader,
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
