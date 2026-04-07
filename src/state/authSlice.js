import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../services/api';
import { storage } from '../utils/storage';

const initialState = {
    user: storage.getUser(),
    token: storage.getToken(),
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
};

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const response = await authApi.login(credentials);
        return response.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
});

export const signup = createAsyncThunk('auth/signup', async (userData, { rejectWithValue }) => {
    try {
        const response = await authApi.signup(userData);
        return response.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Signup failed');
    }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await authApi.logout();
    } catch (err) {
        console.error('Logout error', err);
    } finally {
        storage.clear();
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        resetError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload.user;
                state.token = action.payload.token;
                storage.setToken(action.payload.token);
                storage.setUser(action.payload.user);
                if (action.payload.refreshToken) {
                    storage.setRefreshToken(action.payload.refreshToken);
                }
            })
            .addCase(login.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Signup
            .addCase(signup.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(signup.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload.user;
                state.token = action.payload.token;
                storage.setToken(action.payload.token);
                storage.setUser(action.payload.user);
                if (action.payload.refreshToken) {
                    storage.setRefreshToken(action.payload.refreshToken);
                }
            })
            .addCase(signup.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.status = 'idle';
            });
    },
});

export const { resetError } = authSlice.actions;
export default authSlice.reducer;
