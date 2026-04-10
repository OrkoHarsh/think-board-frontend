import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchBoardDetails,
    updateBoardOptimistically,
    addObjectOptimistically,
    deleteObjectOptimistically
} from '../state/boardSlice';
import { useWebSocket } from './useWebSocket';

const THROTTLE_MS = 50; // max 20 WebSocket updates/sec per object while dragging

export const useBoardData = (boardId, presenceCallbacks = {}) => {
    const dispatch = useDispatch();
    const { activeBoard, status, error } = useSelector((state) => state.board);

    const lastSentRef = useRef({});
    const pendingRef = useRef({});

    const { sendUpdate, sendCursor, sendRaw } = useWebSocket(boardId, presenceCallbacks);

    useEffect(() => {
        if (boardId) {
            dispatch(fetchBoardDetails(boardId));
        }
    }, [boardId, dispatch]);

    const updateObject = useCallback((objectId, updates) => {
        dispatch(updateBoardOptimistically({ objectId, updates }));

        const now = Date.now();
        const lastSent = lastSentRef.current[objectId] || 0;

        if (now - lastSent >= THROTTLE_MS) {
            lastSentRef.current[objectId] = now;
            sendUpdate('update_object', { objectId, updates });
            if (pendingRef.current[objectId]) {
                clearTimeout(pendingRef.current[objectId]);
                pendingRef.current[objectId] = null;
            }
        } else {
            if (pendingRef.current[objectId]) {
                clearTimeout(pendingRef.current[objectId]);
            }
            pendingRef.current[objectId] = setTimeout(() => {
                lastSentRef.current[objectId] = Date.now();
                sendUpdate('update_object', { objectId, updates });
                pendingRef.current[objectId] = null;
            }, THROTTLE_MS - (now - lastSent));
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

    return {
        board: activeBoard,
        status,
        error,
        updateObject,
        addObject,
        deleteObject,
        sendCursor,
        sendRaw,
    };
};
