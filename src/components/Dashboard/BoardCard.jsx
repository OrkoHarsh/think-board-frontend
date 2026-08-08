import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { nimbusConfirm } from '../../utils/nimbusDialog';
import { formatBoardDate } from '../../utils/boardDate';
import BoardThumbnail from './BoardThumbnail';

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

        const confirmed = await nimbusConfirm({
            title: 'Delete board?',
            message: `Delete “${board.title}”? This cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true,
        });

        if (!confirmed) return;

        setIsBusy(true);
        try {
            await onDelete?.(board.id);
        } finally {
            setIsBusy(false);
        }
    };

    const previewObjects = board.previewObjects || board.objects || [];

    return (
        <li
            className={`relative group ${menuOpen ? 'z-50' : 'z-0'} ${
                isBusy ? 'opacity-60 pointer-events-none' : ''
            }`}
        >
            <div
                className="h-full rounded-[10px] border border-hairline bg-surface transition-[box-shadow,border-color,transform] duration-200 hover:border-hairline-strong hover:-translate-y-0.5"
                style={{ boxShadow: 'var(--shadow-soft)' }}
            >
                <Link
                    to={`/board/${board.id}`}
                    className={`block ${isEditing ? 'pointer-events-none' : ''}`}
                    onClick={(e) => {
                        if (isEditing) e.preventDefault();
                    }}
                >
                    <BoardThumbnail objects={previewObjects} size="card" />
                </Link>

                <div className="p-3.5 flex items-start gap-2 relative">
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={titleDraft}
                                disabled={isBusy}
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
                                className="w-full h-8 px-2 rounded-[6px] border border-accent bg-surface text-[14px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent/25"
                            />
                        ) : (
                            <Link
                                to={`/board/${board.id}`}
                                className="block truncate text-[14px] font-semibold text-ink group-hover:text-accent transition-colors"
                            >
                                {board.title}
                            </Link>
                        )}
                        <p className="text-[12px] text-ink-faint mt-1 tabular-nums">
                            Updated {formatBoardDate(board)}
                        </p>
                    </div>

                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            disabled={isBusy}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMenuOpen((v) => !v);
                            }}
                            className="w-8 h-8 rounded-[6px] text-ink-faint hover:text-ink-muted hover:bg-surface-raised flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            title="Board options"
                            aria-label="Board options"
                            aria-expanded={menuOpen}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="1.75" />
                                <circle cx="12" cy="12" r="1.75" />
                                <circle cx="12" cy="19" r="1.75" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div
                                className="absolute right-0 top-9 z-[100] w-36 bg-surface border border-hairline rounded-[8px] py-1"
                                style={{ boxShadow: '0 12px 32px rgba(12,15,18,0.14)' }}
                                role="menu"
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={startRename}
                                    className="w-full px-3 py-1.5 text-left text-[13px] text-ink hover:bg-surface-raised"
                                >
                                    Rename
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleDelete}
                                    className="w-full px-3 py-1.5 text-left text-[13px] text-danger hover:bg-surface-raised"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
};

export default BoardCard;
