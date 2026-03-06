import { useEffect } from "react";

export function UnsavedChangesWarning({ isDirty }) {
    useEffect(() => {
        if (!isDirty) return;

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "";
            return "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    return null;
}