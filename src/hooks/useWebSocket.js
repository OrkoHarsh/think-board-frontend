import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { wsClient } from '../services/wsClient';
import {
    updateBoardOptimistically,
    addObjectOptimistically,
    deleteObjectOptimistically,
} from '../state/boardSlice';

const CURSOR_THROTTLE_MS = 30; // ~33fps for cursor updates

export const useWebSocket = (boardId, { onUserJoin, onUserLeave, onCursorMove } = {}) => {
    const dispatch = useDispatch();
    const lastCursorSent = useRef(0);
    const currentUserId = useSelector((state) => state.auth.user?.id);
    const currentUserIdRef = useRef(currentUserId);
    currentUserIdRef.current = currentUserId;

    useEffect(() => {
        if (!boardId) return;

        wsClient.connect(boardId);

        const isOwn = (userId, payload) => {
            const id = userId || payload?.userId;
            return id && id === currentUserIdRef.current;
        };

        // Skip own echoes — local optimistic updates already applied
        const unsubscribeUpdate = wsClient.subscribe('update_object', (payload, userId) => {
            if (isOwn(userId, payload)) return;
            dispatch(updateBoardOptimistically(payload));
        });

        const unsubscribeAdd = wsClient.subscribe('add_object', (payload, userId) => {
            if (isOwn(userId, payload)) return;
            dispatch(addObjectOptimistically(payload));
        });

        const unsubscribeDelete = wsClient.subscribe('delete_object', (payload, userId) => {
            if (isOwn(userId, payload)) return;
            dispatch(deleteObjectOptimistically(payload.objectId));
        });

        // Presence events
        const unsubscribeJoin = wsClient.subscribe('user.join', (payload) => {
            if (payload?.userId && onUserJoin) {
                onUserJoin(payload.userId, payload.name);
            }
        });

        const unsubscribeLeave = wsClient.subscribe('user.leave', (payload) => {
            if (payload?.userId && onUserLeave) {
                onUserLeave(payload.userId);
            }
        });

        // Remote cursor events (matches backend cursor_move broadcast)
        const unsubscribeCursor = wsClient.subscribe('cursor_move', (payload, userId) => {
            if (isOwn(userId, payload)) return;
            if (payload?.userId && onCursorMove) {
                onCursorMove(payload.userId, payload.x, payload.y);
            }
        });

        return () => {
            unsubscribeUpdate();
            unsubscribeAdd();
            unsubscribeDelete();
            unsubscribeJoin();
            unsubscribeLeave();
            unsubscribeCursor();
            wsClient.disconnect();
        };
    }, [boardId, dispatch, onUserJoin, onUserLeave, onCursorMove]);

    const sendUpdate = useCallback((type, payload) => {
        wsClient.send(type, payload);
    }, []);

    // Throttled cursor emit — max 33fps, doesn't go through the message queue
    const sendCursor = useCallback((x, y) => {
        const now = Date.now();
        if (now - lastCursorSent.current < CURSOR_THROTTLE_MS) return;
        lastCursorSent.current = now;
        wsClient.sendRaw('cursor_move', { x, y });
    }, []);

    // Expose sendRaw for manually emitting events like user.join with custom payload
    const sendRaw = useCallback((type, payload) => {
        wsClient.sendRaw(type, payload);
    }, []);

    return { sendUpdate, sendCursor, sendRaw };
};
