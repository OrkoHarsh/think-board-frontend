import { useEffect, useState } from 'react';
import { boardApi } from '../../services/api';
import { nimbusAlert, nimbusConfirm } from '../../utils/nimbusDialog';

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
            await nimbusAlert({
                title: role === 'EDIT' ? 'Edit access granted' : 'View access granted',
                message: res.data?.message || 'Invite processed.',
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
        const confirmed = await nimbusConfirm({
            title: 'Remove access?',
            message: `Remove ${name} from this board?`,
            confirmText: 'Remove',
            cancelText: 'Cancel',
            danger: true,
        });
        if (!confirmed) return;
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
            <div className="absolute right-0 top-9 z-50 w-[22rem] bg-surface border border-hairline rounded-[8px] p-4" style={{ boxShadow: 'var(--shadow-soft)' }}>
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-[13px] font-semibold text-ink">Share board</p>
                        <p className="text-[12px] text-ink-faint mt-0.5 truncate max-w-[16rem]">
                            {boardTitle || 'Untitled'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-ink-faint hover:text-ink"
                    >
                        ✕
                    </button>
                </div>

                {isOwner ? (
                    <form onSubmit={handleInvite} className="space-y-3 mb-4">
                        <div>
                            <label className="block text-[11px] font-medium text-ink-faint mb-1.5 uppercase tracking-wide">
                                Access
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRole('VIEW')}
                                    className={`px-2 py-2 rounded-[8px] text-[12px] font-medium border transition-colors ${
                                        role === 'VIEW'
                                            ? 'border-accent bg-accent-soft text-accent'
                                            : 'border-hairline text-ink-muted'
                                    }`}
                                >
                                    View only
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('EDIT')}
                                    className={`px-2 py-2 rounded-[8px] text-[12px] font-medium border transition-colors ${
                                        role === 'EDIT'
                                            ? 'border-accent bg-accent-soft text-accent'
                                            : 'border-hairline text-ink-muted'
                                    }`}
                                >
                                    Edit &amp; view
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-ink-faint mb-1.5 uppercase tracking-wide">
                                Username or email
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Registered username or email"
                                className="w-full px-3 py-2 text-[13px] rounded-[8px] border border-hairline bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                                disabled={loading}
                            />
                            <p className="text-[10px] text-ink-faint mt-1">
                                Invite is emailed to their registered address with {role === 'EDIT' ? 'edit' : 'view'} rights.
                            </p>
                        </div>

                        {error && (
                            <div className="text-[12px] text-danger bg-danger/5 border border-danger/20 rounded-[6px] px-2 py-1.5">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !username.trim()}
                            className="w-full py-2 rounded-[8px] text-[13px] font-medium bg-accent hover:bg-accent-hover text-on-accent disabled:opacity-50"
                        >
                            {loading ? 'Sending invite…' : 'Invite & send email'}
                        </button>
                    </form>
                ) : (
                    <p className="text-[12px] text-ink-muted mb-4">
                        Only the board owner can invite people.
                    </p>
                )}

                <div className="border-t border-hairline pt-3 mb-3">
                    <p className="text-[11px] font-medium text-ink-faint uppercase tracking-wide mb-2">
                        People with access
                    </p>
                    {loadingMembers ? (
                        <p className="text-[12px] text-ink-faint">Loading…</p>
                    ) : (
                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {members.map((m) => (
                                <li key={m.userId} className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[12px] font-medium text-ink truncate">
                                            {m.name}
                                        </p>
                                        <p className="text-[10px] text-ink-faint truncate">{m.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-surface-raised text-ink-muted uppercase">
                                            {m.role}
                                        </span>
                                        {isOwner && m.role !== 'OWNER' && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(m.userId, m.name)}
                                                className="text-[10px] text-danger hover:opacity-80"
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

                <div className="border-t border-hairline pt-3">
                    <div className="flex items-center gap-2 bg-paper border border-hairline rounded-[8px] px-3 py-2 mb-2">
                        <span className="text-[12px] text-ink-faint truncate flex-1">
                            {window.location.href}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopyLink}
                        className={`w-full py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
                            copied ? 'bg-success text-on-accent' : 'bg-accent hover:bg-accent-hover text-on-accent'
                        }`}
                    >
                        {copied ? 'Link copied' : 'Copy board link'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ShareBoardModal;
