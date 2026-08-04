import { useEffect, useState } from 'react';
import { boardApi } from '../../services/api';
import Swal from 'sweetalert2';

const ShareBoardModal = ({ boardId, boardTitle, isOwner, onClose }) => {
    const [role, setRole] = useState('VIEW');
    const [username, setUsername] = useState('');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const loadMembers = async () => {
        setLoadingMembers(true);
        try {
            const res = await boardApi.listMembers(boardId);
            setMembers(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, [boardId]);

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!username.trim() || loading) return;
        setLoading(true);
        setError(null);
        try {
            const res = await boardApi.shareBoard(boardId, {
                username: username.trim(),
                role,
            });
            setUsername('');
            await loadMembers();
            const isDark = document.documentElement.classList.contains('dark');
            await Swal.fire({
                icon: res.data?.emailSent ? 'success' : 'info',
                title: role === 'EDIT' ? 'Edit access granted' : 'View access granted',
                text: res.data?.message || 'Invite processed.',
                confirmButtonColor: '#4f46e5',
                background: isDark ? '#1f2937' : '#ffffff',
                color: isDark ? '#f3f4f6' : '#111827',
            });
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.message ||
                'Failed to share board';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (userId, name) => {
        const isDark = document.documentElement.classList.contains('dark');
        const result = await Swal.fire({
            title: 'Remove access?',
            text: `Remove ${name} from this board?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Remove',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: isDark ? '#4b5563' : '#9ca3af',
            background: isDark ? '#1f2937' : '#ffffff',
            color: isDark ? '#f3f4f6' : '#111827',
        });
        if (!result.isConfirmed) return;
        try {
            await boardApi.removeMember(boardId, userId);
            await loadMembers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove member');
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
            <div className="absolute right-0 top-10 z-50 w-[22rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Share board</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[16rem]">
                            {boardTitle || 'Untitled'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                {isOwner ? (
                    <form onSubmit={handleInvite} className="space-y-3 mb-4">
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                                Access
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRole('VIEW')}
                                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                                        role === 'VIEW'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                                    }`}
                                >
                                    View only
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('EDIT')}
                                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                                        role === 'EDIT'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                                    }`}
                                >
                                    Edit &amp; view
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                                Username or email
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Registered username or email"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                disabled={loading}
                            />
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                Invite is emailed to their registered address with {role === 'EDIT' ? 'edit' : 'view'} rights.
                            </p>
                        </div>

                        {error && (
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-2 py-1.5">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !username.trim()}
                            className="w-full py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                        >
                            {loading ? 'Sending invite…' : 'Invite & send email'}
                        </button>
                    </form>
                ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Only the board owner can invite people.
                    </p>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        People with access
                    </p>
                    {loadingMembers ? (
                        <p className="text-xs text-gray-400">Loading…</p>
                    ) : (
                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {members.map((m) => (
                                <li key={m.userId} className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
                                            {m.name}
                                        </p>
                                        <p className="text-[10px] text-gray-400 truncate">{m.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                                            {m.role}
                                        </span>
                                        {isOwner && m.role !== 'OWNER' && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(m.userId, m.name)}
                                                className="text-[10px] text-red-500 hover:text-red-600"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                            {window.location.href}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopyLink}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                            copied ? 'bg-green-500 text-white' : 'bg-gray-900 dark:bg-gray-600 hover:bg-gray-800 text-white'
                        }`}
                    >
                        {copied ? '✓ Link copied' : 'Copy board link'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ShareBoardModal;
