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
        <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Shape Library
                </span>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Close"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-gray-100">
                <div className="relative">
                    <svg
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
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
                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-gray-50"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 px-2 py-2 overflow-x-auto scrollbar-none border-b border-gray-100 flex-shrink-0">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => { setActiveCategory(cat); setSearch(''); }}
                        className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                            activeCategory === cat
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Icon Grid */}
            <div className="flex-1 overflow-y-auto p-2">
                {visibleIcons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
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
            <div className="px-3 py-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 text-center">
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
            className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors group"
            title={icon.label}
        >
            <div className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-md group-hover:bg-indigo-100 transition-colors">
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                )}
            </div>
            <span className="text-[9px] text-gray-500 group-hover:text-indigo-600 leading-tight text-center max-w-full truncate w-full">
                {icon.label}
            </span>
        </button>
    );
};

export default IconPalette;
