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
    const day = 86400000;
    if (diff >= 0 && diff < day) return 'Today';
    if (diff >= 0 && diff < day * 2) return 'Yesterday';
    if (diff >= 0 && diff < day * 7) return `${Math.floor(diff / day)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function boardTimestamp(board) {
    const raw = board?.updatedAt || board?.createdAt || board?.updated_at || board?.created_at;
    if (raw == null || raw === '') return 0;
    if (typeof raw === 'number') return raw < 1e12 ? raw * 1000 : raw;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? 0 : t;
}
