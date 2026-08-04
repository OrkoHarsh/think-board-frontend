import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchBoardDetails,
    updateBoardOptimistically,
    addObjectOptimistically,
    deleteObjectOptimistically,
    replaceBoardObjectsOptimistically,
} from '../state/boardSlice';
import { useWebSocket } from './useWebSocket';

const THROTTLE_MS = 50; // max 20 WebSocket updates/sec per object while dragging

export const useBoardData = (boardId, presenceCallbacks = {}) => {
    const dispatch = useDispatch();
    const { activeBoard, status, error } = useSelector((state) => state.board);

    const lastSentRef = useRef({});
    const pendingRef = useRef({});
    const latestUpdatesRef = useRef({});

    const { sendUpdate, sendCursor, sendRaw } = useWebSocket(boardId, presenceCallbacks);

    useEffect(() => {
        if (boardId) {
            dispatch(fetchBoardDetails(boardId));
        }
    }, [boardId, dispatch]);

    const updateObject = useCallback((objectId, updates) => {
        dispatch(updateBoardOptimistically({ objectId, updates }));
        // Merge patches so rapid style changes don't drop earlier keys
        latestUpdatesRef.current[objectId] = {
            ...(latestUpdatesRef.current[objectId] || {}),
            ...updates,
        };

        const now = Date.now();
        const lastSent = lastSentRef.current[objectId] || 0;

        const flush = () => {
            lastSentRef.current[objectId] = Date.now();
            sendUpdate('update_object', {
                objectId,
                updates: latestUpdatesRef.current[objectId],
            });
            latestUpdatesRef.current[objectId] = null;
            pendingRef.current[objectId] = null;
        };

        if (pendingRef.current[objectId]) {
            clearTimeout(pendingRef.current[objectId]);
            pendingRef.current[objectId] = null;
        }

        if (now - lastSent >= THROTTLE_MS) {
            flush();
        } else {
            pendingRef.current[objectId] = setTimeout(flush, THROTTLE_MS - (now - lastSent));
        }
    }, [dispatch, sendUpdate]);

    const addObject = useCallback((object) => {
        console.log('[useBoardData] addObject called:', object.id, object.type);
        dispatch(addObjectOptimistically(object));
        sendUpdate('add_object', object);
    }, [dispatch, sendUpdate]);

    const deleteObject = useCallback((objectId) => {
        dispatch(deleteObjectOptimistically(objectId));
        sendUpdate('delete_object', { objectId });
    }, [dispatch, sendUpdate]);

    const replaceAllObjects = useCallback((newObjects, { persist = true } = {}) => {
        const oldIds = (activeBoard?.objects || []).map((o) => o.id);
        dispatch(replaceBoardObjectsOptimistically(newObjects));

        if (!persist) return;

        oldIds.forEach((objectId) => {
            if (!newObjects.some((o) => o.id === objectId)) {
                sendUpdate('delete_object', { objectId });
            }
        });
        newObjects.forEach((object) => {
            if (!oldIds.includes(object.id)) {
                sendUpdate('add_object', object);
            }
        });
    }, [dispatch, sendUpdate, activeBoard?.objects]);

    return {
        board: activeBoard,
        status,
        error,
        updateObject,
        addObject,
        deleteObject,
        replaceAllObjects,
        sendCursor,
        sendRaw,
    };
};
