export function formatBoardDate(board) {
    const raw = board?.updatedAt || board?.createdAt || board?.updated_at || board?.created_at;
    if (raw == null || raw === '') return 'Recently';

    let date;
    if (typeof raw === 'number') {
        date = new Date(raw < 1e12 ? raw * 1000 : raw);
    } else {
        date = new Date(raw);
    }

    if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) {
        return 'Recently';
    }

    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 0) return 'Just now';
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 86_400_000 * 2) return 'Yesterday';
    if (diff < 86_400_000 * 7) return `${Math.floor(diff / 86_400_000)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function boardTimestamp(board) {
    const raw = board?.updatedAt || board?.createdAt || board?.updated_at || board?.created_at;
    if (raw == null || raw === '') return 0;
    if (typeof raw === 'number') return raw < 1e12 ? raw * 1000 : raw;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? 0 : t;
}
