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

export const createBoard = createAsyncThunk('board/createBoard', async (title, { rejectWithValue }) => {
    try {
        const response = await boardApi.createBoard(title);
        return response.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to create board');
    }
});

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
            }
        },
        addObjectOptimistically: (state, action) => {
            console.log('[Redux] addObjectOptimistically:', action.payload.id, action.payload.type);
            console.log('[Redux] activeBoard exists:', !!state.activeBoard);
            console.log('[Redux] activeBoard.objects exists:', !!state.activeBoard?.objects);
            console.log('[Redux] objects count before:', state.activeBoard?.objects?.length || 0);
            
            if (state.activeBoard && state.activeBoard.objects) {
                const exists = state.activeBoard.objects.some(o => o.id === action.payload.id);
                if (!exists) {
                    state.activeBoard.objects.push(action.payload);
                    console.log('[Redux] Object added! New count:', state.activeBoard.objects.length);
                } else {
                    console.log('[Redux] Object already exists, skipping');
                }
            } else {
                console.error('[Redux] CANNOT ADD: activeBoard or objects is null!');
                console.error('[Redux] state.activeBoard:', state.activeBoard);
            }
        },
        deleteObjectOptimistically: (state, action) => {
            if (state.activeBoard) {
                state.activeBoard.objects = state.activeBoard.objects.filter((o) => o.id !== action.payload);
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
                state.boards.push(action.payload);
            });
    },
});

export const {
    setActiveBoard,
    updateBoardOptimistically,
    addObjectOptimistically,
    deleteObjectOptimistically,
    rollbackUpdate,
} = boardSlice.actions;

export default boardSlice.reducer;
