import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const BoardCard = ({ board, onRename, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [titleDraft, setTitleDraft] = useState(board.title || '');
    const [isBusy, setIsBusy] = useState(false);
    const menuRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        setTitleDraft(board.title || '');
    }, [board.title]);

    useEffect(() => {
        if (!menuOpen) return;
        const onDocClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [menuOpen]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const startRename = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(false);
        setTitleDraft(board.title || '');
        setIsEditing(true);
    };

    const cancelRename = () => {
        setTitleDraft(board.title || '');
        setIsEditing(false);
    };

    const saveRename = async () => {
        const next = titleDraft.trim();
        if (!next || next === board.title) {
            cancelRename();
            return;
        }
        setIsBusy(true);
        try {
            await onRename?.(board.id, next);
            setIsEditing(false);
        } finally {
            setIsBusy(false);
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(false);

        const isDark = document.documentElement.classList.contains('dark');
        const result = await Swal.fire({
            title: 'Delete board?',
            html: `Delete <strong>"${board.title}"</strong>?<br/>This cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            focusCancel: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: isDark ? '#4b5563' : '#9ca3af',
            background: isDark ? '#1f2937' : '#ffffff',
            color: isDark ? '#f3f4f6' : '#111827',
        });

        if (!result.isConfirmed) return;

        setIsBusy(true);
        try {
            await onDelete?.(board.id);
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <div className="relative group">
            <Link
                to={`/board/${board.id}`}
                className={`block ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                onClick={(e) => {
                    if (isEditing) e.preventDefault();
                }}
            >
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col">
                    {/* Preview Area */}
                    <div className="h-40 bg-gray-50 dark:bg-gray-700 flex items-center justify-center p-6 border-b border-gray-100 dark:border-gray-600">
                        {board.previewType === 'sticky' ? (
                            <div className="w-32 h-24 bg-yellow-200 rounded shadow-sm transform -rotate-1 flex items-center justify-center p-2 text-center">
                                <span className="text-xs font-handwriting text-gray-700">Welcome Email</span>
                            </div>
                        ) : (
                            <div className="w-32 h-24 bg-blue-200 rounded shadow-sm transform rotate-1"></div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="pr-8">
                            {isEditing ? (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={titleDraft}
                                    disabled={isBusy}
                                    onClick={(e) => e.preventDefault()}
                                    onChange={(e) => setTitleDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            saveRename();
                                        } else if (e.key === 'Escape') {
                                            e.preventDefault();
                                            cancelRename();
                                        }
                                    }}
                                    onBlur={saveRename}
                                    className="w-full text-base font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-indigo-400 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            ) : (
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                    {board.title}
                                </h3>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatDate(board.updatedAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Actions menu */}
            <div className="absolute top-3 right-3 z-10" ref={menuRef}>
                <button
                    type="button"
                    disabled={isBusy}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen((v) => !v);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
                    title="Board options"
                    aria-label="Board options"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="1.75" />
                        <circle cx="12" cy="12" r="1.75" />
                        <circle cx="12" cy="19" r="1.75" />
                    </svg>
                </button>

                {menuOpen && (
                    <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 overflow-hidden">
                        <button
                            type="button"
                            onClick={startRename}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Rename
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BoardCard;
