import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBoards, createBoard, updateBoard, deleteBoard } from '../../state/boardSlice';
import { logout } from '../../state/authSlice';
import BoardCard from './BoardCard';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import BrandMark from '../brand/BrandMark';
import { nimbusAlert } from '../../utils/nimbusDialog';
import { boardTimestamp, formatBoardDate } from '../../utils/boardDate';

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { boards, status, error } = useSelector((state) => state.board);
    const { user } = useSelector((state) => state.auth);
    const [isCreating, setIsCreating] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [query, setQuery] = useState('');
    const [isDark, toggleTheme] = useTheme();

    useEffect(() => {
        dispatch(fetchBoards());
    }, [dispatch]);

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        if (!newBoardTitle.trim()) return;
        await dispatch(createBoard(newBoardTitle));
        setNewBoardTitle('');
        setIsCreating(false);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleRenameBoard = async (boardId, title) => {
        const result = await dispatch(updateBoard({ boardId, title }));
        if (updateBoard.rejected.match(result)) {
            await nimbusAlert({ message: result.payload || 'Failed to rename board' });
        }
    };

    const handleDeleteBoard = async (boardId) => {
        const result = await dispatch(deleteBoard(boardId));
        if (deleteBoard.rejected.match(result)) {
            await nimbusAlert({ message: result.payload || 'Failed to delete board' });
        }
    };

    const filtered = boards.filter((b) =>
        (b.title || '').toLowerCase().includes(query.trim().toLowerCase())
    );

    const continueBoard = useMemo(() => {
        if (!boards.length || query.trim()) return null;
        return [...boards].sort((a, b) => boardTimestamp(b) - boardTimestamp(a))[0];
    }, [boards, query]);

    const gridBoards = useMemo(() => {
        if (!continueBoard) return filtered;
        return filtered.filter((b) => b.id !== continueBoard.id);
    }, [filtered, continueBoard]);

    const firstName = user?.name?.split(' ')[0] || 'there';

    return (
        <div className="min-h-screen bg-paper text-ink relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] nimbus-atmosphere-dash" />

            <header className="relative h-14 border-b border-hairline/80 bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
                <div className="flex items-center gap-2.5 min-w-0">
                    <BrandMark className="w-7 h-7" />
                    <span className="font-display text-[15px] font-semibold tracking-tight truncate">
                        NimbusBoard
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="h-8 w-8 rounded-[6px] border border-hairline text-ink-muted hover:bg-surface-raised flex items-center justify-center"
                        title={isDark ? 'Light mode' : 'Dark mode'}
                    >
                        {isDark ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>
                    <div className="flex items-center gap-2.5 pl-1 border-l border-hairline ml-1">
                        <div className="w-8 h-8 rounded-full bg-accent text-on-accent text-[12px] font-semibold flex items-center justify-center">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="hidden sm:block leading-tight">
                            <p className="text-[12px] font-medium text-ink truncate max-w-[120px]">{user?.name}</p>
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/change-password"
                                    className="text-[11px] text-ink-faint hover:text-ink-muted"
                                >
                                    Change password
                                </Link>
                                <span className="text-ink-faint text-[10px]">·</span>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="text-[11px] text-ink-faint hover:text-ink-muted"
                                >
                                    Log out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-12">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
                    <div className="max-w-xl">
                        <h1 className="font-display text-[32px] sm:text-[36px] font-semibold tracking-tight leading-tight">
                            Good to see you, {firstName}
                        </h1>
                        <p className="text-[15px] text-ink-muted mt-2 leading-relaxed">
                            Continue where you left off, or start a fresh canvas for the next idea.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[8px] bg-ink text-surface text-[14px] font-medium hover:bg-ink/90 transition-colors self-start lg:self-auto shrink-0"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New board
                    </button>
                </div>

                {continueBoard && status !== 'loading' && (
                    <Link
                        to={`/board/${continueBoard.id}`}
                        className="mb-8 group block rounded-[12px] border border-hairline bg-surface overflow-hidden hover:border-accent/40 transition-colors"
                        style={{ boxShadow: 'var(--shadow-soft)' }}
                    >
                        <div className="flex flex-col sm:flex-row">
                            <div
                                className="sm:w-[42%] h-[140px] sm:h-auto min-h-[140px] bg-canvas border-b sm:border-b-0 sm:border-r border-hairline relative"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(circle, var(--canvas-dot) 0.7px, transparent 0.7px)',
                                    backgroundSize: '18px 18px',
                                }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[12px] text-ink-faint font-medium tracking-wide">
                                        Open canvas
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-accent">
                                        Continue
                                    </span>
                                    <span className="text-[12px] text-ink-faint tabular-nums">
                                        Updated {formatBoardDate(continueBoard)}
                                    </span>
                                </div>
                                <p className="font-display text-[22px] sm:text-[24px] font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
                                    {continueBoard.title}
                                </p>
                                <span className="inline-flex items-center gap-1.5 self-start h-9 px-3.5 rounded-[8px] bg-accent text-on-accent text-[13px] font-medium group-hover:bg-accent-hover transition-colors">
                                    Resume board
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                                        <path d="M5 12h14M13 6l6 6-6 6" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </Link>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                    <div className="relative flex-1">
                        <svg
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                            width="15"
                            height="15"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full h-11 pl-10 pr-3 rounded-[8px] border border-hairline bg-surface text-[14px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent"
                            placeholder="Search boards…"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-ink-muted shrink-0">
                        <span className="inline-flex items-center h-8 px-2.5 rounded-[6px] bg-surface border border-hairline font-medium tabular-nums">
                            {filtered.length} board{filtered.length === 1 ? '' : 's'}
                        </span>
                    </div>
                </div>

                {isCreating && (
                    <form
                        onSubmit={handleCreateBoard}
                        className="mb-6 flex flex-col sm:flex-row gap-2 p-4 rounded-[10px] border border-hairline bg-surface"
                        style={{ boxShadow: 'var(--shadow-soft)' }}
                    >
                        <input
                            type="text"
                            value={newBoardTitle}
                            onChange={(e) => setNewBoardTitle(e.target.value)}
                            placeholder="Name your board…"
                            className="flex-1 h-10 px-3 rounded-[8px] border border-hairline bg-paper text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="h-10 px-4 rounded-[8px] bg-ink text-surface text-[13px] font-medium"
                            >
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewBoardTitle('');
                                }}
                                className="h-10 px-4 rounded-[8px] border border-hairline text-[13px] text-ink-muted hover:bg-surface-raised"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {status === 'loading' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="h-[200px] rounded-[10px] border border-hairline bg-surface/60 animate-pulse"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <p className="py-16 text-center text-[14px] text-danger">{error}</p>
                ) : filtered.length === 0 ? (
                    <div
                        className="py-20 px-6 text-center rounded-[12px] border border-dashed border-hairline-strong bg-surface/70"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle, var(--canvas-dot) 0.7px, transparent 0.7px)',
                            backgroundSize: '20px 20px',
                        }}
                    >
                        <div className="inline-flex w-12 h-12 rounded-[10px] bg-accent-soft text-accent items-center justify-center mb-4">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M3 9h18M9 21V9" />
                            </svg>
                        </div>
                        <p className="font-display text-lg font-semibold tracking-tight text-ink mb-1">
                            {query.trim() ? 'No matching boards' : 'Your canvas is empty'}
                        </p>
                        <p className="text-[14px] text-ink-muted mb-5 max-w-sm mx-auto">
                            {query.trim()
                                ? 'Try a different search term.'
                                : 'Create a board and start mapping ideas with your team.'}
                        </p>
                        {!query.trim() && (
                            <button
                                type="button"
                                onClick={() => setIsCreating(true)}
                                className="inline-flex h-10 px-4 items-center rounded-[8px] bg-ink text-surface text-[13px] font-medium"
                            >
                                Create your first board
                            </button>
                        )}
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
                        {gridBoards.map((board, index) => (
                            <BoardCard
                                key={board.id}
                                board={board}
                                index={index}
                                onRename={handleRenameBoard}
                                onDelete={handleDeleteBoard}
                            />
                        ))}
                        <li>
                            <button
                                type="button"
                                onClick={() => setIsCreating(true)}
                                className="w-full h-full min-h-[200px] rounded-[10px] border border-dashed border-hairline-strong bg-surface/40 hover:bg-surface hover:border-accent/40 transition-colors flex flex-col items-center justify-center gap-2 text-ink-muted hover:text-accent group"
                            >
                                <span className="w-10 h-10 rounded-[8px] border border-hairline group-hover:border-accent/40 group-hover:bg-accent-soft flex items-center justify-center transition-colors">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </span>
                                <span className="text-[13px] font-medium">New board</span>
                            </button>
                        </li>
                    </ul>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
