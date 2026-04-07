import { Client } from '@stomp/stompjs';
import { storage } from '../utils/storage';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

class WSClient {
    constructor() {
        this.client = null;
        this.boardId = null;
        this.subscription = null;
        this.listeners = new Map();
        this.messageQueue = [];
        this.isConnected = false;
    }

    connect(boardId) {
        this.disconnect();
        this.boardId = boardId;

        const token = storage.getToken();
        const url = token ? `${WS_BASE_URL}?token=${token}` : WS_BASE_URL;

        this.client = new Client({
            brokerURL: url,
            connectHeaders: {
                token: token || '',
            },
            reconnectDelay: 3000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: (str) => {
                if (import.meta.env.DEV) {
                    // console.log('STOMP:', str);
                }
            },
            onConnect: () => {
                console.log('WebSocket Connected (STOMP)');
                this.isConnected = true;

                // Subscribe to the board topic
                this.subscription = this.client.subscribe(
                    `/topic/board.${boardId}`,
                    (message) => {
                        try {
                            const data = JSON.parse(message.body);
                            this.handleMessage(data);
                        } catch (error) {
                            console.error('Failed to parse STOMP message:', error);
                        }
                    }
                );

                // Send join event
                this.sendRaw('user.join', { boardId });

                // Flush queued messages
                this.flushQueue();
            },
            onStompError: (frame) => {
                console.error('STOMP Error:', frame.headers?.message || frame);
            },
            onWebSocketClose: () => {
                console.log('WebSocket Disconnected');
                this.isConnected = false;
                this.subscription = null;
            },
            onWebSocketError: () => {
                console.log('WebSocket connection failed (Backend not running). Switching to offline mode.');
            },
        });

        this.client.activate();
    }

    send(type, payload) {
        const message = { type, boardId: this.boardId, payload };
        if (this.isConnected && this.client?.connected) {
            this.client.publish({
                destination: `/app/board.${this.boardId}`,
                body: JSON.stringify(message),
            });
        } else {
            this.messageQueue.push(message);
        }
    }

    sendRaw(type, payload) {
        if (this.isConnected && this.client?.connected) {
            this.client.publish({
                destination: `/app/board.${this.boardId}`,
                body: JSON.stringify({ type, boardId: this.boardId, payload }),
            });
        }
    }

    flushQueue() {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            this.client.publish({
                destination: `/app/board.${this.boardId}`,
                body: JSON.stringify(message),
            });
        }
    }

    subscribe(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type).add(callback);

        return () => {
            if (this.listeners.has(type)) {
                this.listeners.get(type).delete(callback);
            }
        };
    }

    handleMessage(message) {
        const { type, payload } = message;
        if (this.listeners.has(type)) {
            this.listeners.get(type).forEach((callback) => callback(payload));
        }
    }

    disconnect() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.isConnected = false;
        }
        this.boardId = null;
    }
}

export const wsClient = new WSClient();
