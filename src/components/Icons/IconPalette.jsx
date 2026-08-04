import React, { useState, useMemo } from 'react';
import { ICON_CATEGORIES, getAllIcons, getIconUrl } from './iconRegistry';

const ALL_LABEL = 'All';

const IconPalette = ({ onAddIcon, onClose }) => {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(ALL_LABEL);

    const categories = [ALL_LABEL, ...ICON_CATEGORIES.map((c) => c.label)];

    const visibleIcons = useMemo(() => {
        const q = search.toLowerCase().trim();
        const pool =
            activeCategory === ALL_LABEL
                ? getAllIcons()
                : (ICON_CATEGORIES.find((c) => c.label === activeCategory)?.icons ?? []);
        return q ? pool.filter((i) => i.label.toLowerCase().includes(q)) : pool;
    }, [search, activeCategory]);

    return (
        <div
            className="absolute bottom-20 left-4 z-30 w-64 max-h-[min(420px,calc(100%-6rem))] bg-surface/95 border border-hairline rounded-[8px] flex flex-col overflow-hidden"
            style={{ boxShadow: 'var(--shadow-soft)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-hairline">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                    Shape Library
                </span>
                <button
                    onClick={onClose}
                    className="p-1 rounded-[6px] hover:bg-surface-raised text-ink-faint hover:text-ink transition-colors"
                    title="Close"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-hairline">
                <div className="relative">
                    <svg
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-faint"
                        width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search icons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-[12px] text-ink border border-hairline rounded-[6px] focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent bg-paper"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 px-2 py-2 overflow-x-auto scrollbar-none border-b border-hairline flex-shrink-0">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => { setActiveCategory(cat); setSearch(''); }}
                        className={`px-2 py-1 rounded-[6px] text-[10px] font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                            activeCategory === cat
                                ? 'bg-accent-soft text-accent'
                                : 'text-ink-faint hover:bg-surface-raised'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Icon Grid */}
            <div className="flex-1 overflow-y-auto p-2">
                {visibleIcons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span className="text-xs mt-2">No icons found</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-1">
                        {visibleIcons.map((icon) => (
                            <IconCard key={icon.key} icon={icon} onAdd={onAddIcon} />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                    Click icon to place on canvas
                </p>
            </div>
        </div>
    );
};

const IconCard = ({ icon, onAdd }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <button
            onClick={() => onAdd(icon)}
            className="flex flex-col items-center gap-1 p-1.5 rounded-[6px] hover:bg-accent-soft transition-colors group"
            title={icon.label}
        >
            <div className="w-9 h-9 flex items-center justify-center bg-paper rounded-[6px] group-hover:bg-accent-soft transition-colors">
                {!error ? (
                    <img
                        src={getIconUrl(icon.key)}
                        alt={icon.label}
                        width={28}
                        height={28}
                        onLoad={() => setLoaded(true)}
                        onError={() => setError(true)}
                        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.15s' }}
                    />
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b939e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                )}
            </div>
            <span className="text-[9px] text-ink-faint group-hover:text-accent leading-tight text-center max-w-full truncate w-full">
                {icon.label}
            </span>
        </button>
    );
};

export default IconPalette;
