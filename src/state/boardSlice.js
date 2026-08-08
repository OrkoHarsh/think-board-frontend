import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { boardApi } from '../services/api';

const initialState = {
    boards: [],
    activeBoard: null,
    status: 'idle',
    error: null,
};

export const fetchBoards = createAsyncThunk('board/fetchBoards', async (_, { rejectWithValue }) => {
    try {
        const response = await boardApi.getBoards();
        return response.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch boards');
    }
});

export const fetchBoardDetails = createAsyncThunk('board/fetchBoardDetails', async (boardId, { rejectWithValue }) => {
    try {
        const response = await boardApi.getBoardById(boardId);
        return response.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch board details');
    }
});

export const createBoard = createAsyncThunk(
    'board/createBoard',
    async ({ title, templateSlug }, { rejectWithValue }) => {
        try {
            const response = await boardApi.createBoard(title, templateSlug);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to create board');
        }
    }
);

export const updateBoard = createAsyncThunk(
    'board/updateBoard',
    async ({ boardId, title }, { rejectWithValue }) => {
        try {
            const response = await boardApi.updateBoard(boardId, { title });
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update board');
        }
    }
);

export const deleteBoard = createAsyncThunk(
    'board/deleteBoard',
    async (boardId, { rejectWithValue }) => {
        try {
            await boardApi.deleteBoard(boardId);
            return boardId;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to delete board');
        }
    }
);

const boardSlice = createSlice({
    name: 'board',
    initialState,
    reducers: {
        setActiveBoard: (state, action) => {
            state.activeBoard = action.payload;
        },
        updateBoardOptimistically: (state, action) => {
            const { objectId, updates } = action.payload;
            if (state.activeBoard) {
                const existing = state.activeBoard.objects.find((o) => o.id === objectId);
                if (existing) {
                    Object.assign(existing, updates);
                }
                const now = new Date().toISOString();
                state.activeBoard.updatedAt = now;
                const summary = state.boards.find((b) => b.id === state.activeBoard.id);
                if (summary) summary.updatedAt = now;
            }
        },
        addObjectOptimistically: (state, action) => {
            if (!state.activeBoard) {
                console.error('[Redux] CANNOT ADD: activeBoard is null');
                return;
            }
            if (!state.activeBoard.objects) {
                state.activeBoard.objects = [];
            }
            const exists = state.activeBoard.objects.some(o => o.id === action.payload.id);
            if (!exists) {
                state.activeBoard.objects.push(action.payload);
            }
            const now = new Date().toISOString();
            state.activeBoard.updatedAt = now;
            const summary = state.boards.find((b) => b.id === state.activeBoard.id);
            if (summary) summary.updatedAt = now;
        },
        replaceBoardObjectsOptimistically: (state, action) => {
            if (!state.activeBoard) return;
            state.activeBoard.objects = action.payload;
            const now = new Date().toISOString();
            state.activeBoard.updatedAt = now;
            const summary = state.boards.find((b) => b.id === state.activeBoard.id);
            if (summary) summary.updatedAt = now;
        },
        deleteObjectOptimistically: (state, action) => {
            if (state.activeBoard) {
                state.activeBoard.objects = state.activeBoard.objects.filter((o) => o.id !== action.payload);
                const now = new Date().toISOString();
                state.activeBoard.updatedAt = now;
                const summary = state.boards.find((b) => b.id === state.activeBoard.id);
                if (summary) summary.updatedAt = now;
            }
        },
        rollbackUpdate: (state, action) => {
            const { previousState } = action.payload;
            if (state.activeBoard) {
                state.activeBoard.objects = previousState;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Boards
            .addCase(fetchBoards.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchBoards.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.boards = action.payload;
            })
            .addCase(fetchBoards.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Fetch Board Details
            .addCase(fetchBoardDetails.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchBoardDetails.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const board = action.payload;
                if (!board.objects) {
                    board.objects = [];
                }
                // Backend stores custom fields (iconKey, label, etc.) inside the
                // JSONB `properties` column and only flattens common fields (x, y,
                // width, height, fill, text, stroke). Merge properties → root so
                // every component can read fields directly regardless of DB round-trip.
                if (board?.objects) {
                    board.objects = board.objects.map((obj) => ({
                        ...(obj.properties || {}),
                        ...obj,
                    }));
                }
                state.activeBoard = board;
            })
            .addCase(fetchBoardDetails.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Create Board
            .addCase(createBoard.fulfilled, (state, action) => {
                const created = action.payload;
                // Creation returns a full board; dashboard cards render previewObjects, so derive them
                // here or a template-seeded board would look empty until the next fetch.
                state.boards.push({
                    ...created,
                    previewObjects: created.previewObjects || created.objects || [],
                });
            })
            // Update Board (rename)
            .addCase(updateBoard.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.boards.findIndex((b) => b.id === updated.id);
                if (idx !== -1) {
                    state.boards[idx] = { ...state.boards[idx], ...updated };
                }
                if (state.activeBoard?.id === updated.id) {
                    state.activeBoard = { ...state.activeBoard, ...updated };
                }
            })
            // Delete Board
            .addCase(deleteBoard.fulfilled, (state, action) => {
                const boardId = action.payload;
                state.boards = state.boards.filter((b) => b.id !== boardId);
                if (state.activeBoard?.id === boardId) {
                    state.activeBoard = null;
                }
            });
    },
});

export const {
    setActiveBoard,
    updateBoardOptimistically,
    addObjectOptimistically,
    deleteObjectOptimistically,
    replaceBoardObjectsOptimistically,
    rollbackUpdate,
} = boardSlice.actions;

export default boardSlice.reducer;
