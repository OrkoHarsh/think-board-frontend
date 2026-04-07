import axios from 'axios';
import { storage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = storage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Track if a refresh is already in progress to avoid parallel refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

// Response interceptor — auto-refresh access token on 401/403
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // Only attempt refresh on 401/403, and not for auth endpoints themselves
        if (
            (status === 401 || status === 403) &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/auth/')
        ) {
            const refreshToken = storage.getRefreshToken();

            if (!refreshToken) {
                storage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Queue this request until refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const res = await api.post('/auth/refresh', { refreshToken });
                const newToken = res.data.data.token;
                const newRefreshToken = res.data.data.refreshToken;

                storage.setToken(newToken);
                if (newRefreshToken) storage.setRefreshToken(newRefreshToken);

                api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                processQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                storage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Backend returns ApiResponse: { success, data, message }
 * These helpers unwrap the response so slices get the inner data directly.
 */

export const authApi = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return { data: response.data.data }; // { user, token }
    },
    signup: async (userData) => {
        const response = await api.post('/auth/signup', userData);
        return { data: response.data.data }; // { user, token }
    },
    logout: async () => {
        const token = storage.getToken();
        if (token) {
            try {
                await api.post('/auth/logout');
            } catch {
                // Logout best-effort
            }
        }
        return { data: { message: 'Logged out' } };
    },
    me: async () => {
        const response = await api.get('/auth/me');
        return { data: response.data.data }; // user object
    },
};

export const boardApi = {
    getBoards: async () => {
        const response = await api.get('/boards');
        return { data: response.data.data }; // array of board summaries
    },
    getBoardById: async (boardId) => {
        const response = await api.get(`/boards/${boardId}`);
        return { data: response.data.data }; // { id, title, objects }
    },
    createBoard: async (title) => {
        const response = await api.post('/boards', { title });
        return { data: response.data.data }; // board object
    },
    updateBoard: async (boardId, data) => {
        const response = await api.put(`/boards/${boardId}`, data);
        return { data: response.data.data };
    },
    deleteBoard: async (boardId) => {
        const response = await api.delete(`/boards/${boardId}`);
        return { data: response.data.data };
    },
    batchUpdateObjects: async (boardId, objects) => {
        const response = await api.post(`/boards/${boardId}/objects/batch`, { objects });
        return { data: response.data.data };
    },
};

export const aiApi = {
    generate: async (boardId, prompt) => {
        const response = await api.post('/ai/generate', { boardId, prompt });
        return { data: response.data.data }; // { nodes, edges }
    },
};

export default api;
