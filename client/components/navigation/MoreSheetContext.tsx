import React, { createContext, useContext, useState, useCallback } from "react";

type Ctx = {
    open: () => void;
    close: () => void;
    visible: boolean;
};
const MoreSheetCtx = createContext<Ctx | null>(null);

export function MoreSheetProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const open = useCallback(() => setVisible(true), []);
    const close = useCallback(() => setVisible(false), []);
    return (
        <MoreSheetCtx.Provider value={{ open, close, visible }}>
            {children}
        </MoreSheetCtx.Provider>
    );
}

export const useMoreSheet = () => {
    const ctx = useContext(MoreSheetCtx);
    if (!ctx) {
        throw new Error("useMoreSheet must be used within a MoreSheetProvider");
    }
    return ctx;
};
