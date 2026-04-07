import { useState, useCallback } from 'react';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

// Deterministic color from userId — same user always gets same color, no server state needed
export const getUserColor = (userId) => {
    if (!userId) return COLORS[0];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
};

export const usePresence = () => {
    // { [userId]: { userId, name, color, x, y } }
    const [presence, setPresence] = useState({});

    const addUser = useCallback((userId, name) => {
        setPresence((prev) => ({
            ...prev,
            [userId]: {
                userId,
                name: name || userId.slice(0, 8),
                color: getUserColor(userId),
                x: 0,
                y: 0,
            },
        }));
    }, []);

    const removeUser = useCallback((userId) => {
        setPresence((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
        });
    }, []);

    const updateCursor = useCallback((userId, x, y) => {
        setPresence((prev) => {
            if (!prev[userId]) return prev;
            return {
                ...prev,
                [userId]: { ...prev[userId], x, y },
            };
        });
    }, []);

    return { presence, addUser, removeUser, updateCursor };
};
