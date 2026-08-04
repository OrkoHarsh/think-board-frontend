import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Confluence-style color palette with shades
const COLOR_PALETTE = [
    { label: 'Gray',   shades: ['#F3F4F6', '#D1D5DB', '#9CA3AF', '#6B7280', '#374151', '#111827'] },
    { label: 'Red',    shades: ['#FEE2E2', '#FECACA', '#FCA5A5', '#EF4444', '#DC2626', '#991B1B'] },
    { label: 'Orange', shades: ['#FFEDD5', '#FED7AA', '#FDBA74', '#F97316', '#EA580C', '#9A3412'] },
    { label: 'Yellow', shades: ['#FEF9C3', '#FEF08A', '#FDE047', '#EAB308', '#CA8A04', '#854D0E'] },
    { label: 'Green',  shades: ['#DCFCE7', '#BBF7D0', '#86EFAC', '#22C55E', '#16A34A', '#166534'] },
    { label: 'Teal',   shades: ['#CCFBF1', '#99F6E4', '#5EEAD4', '#14B8A6', '#0D9488', '#115E59'] },
    { label: 'Blue',   shades: ['#DBEAFE', '#BFDBFE', '#93C5FD', '#3B82F6', '#2563EB', '#1E40AF'] },
    { label: 'Indigo', shades: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#6366F1', '#4F46E5', '#3730A3'] },
    { label: 'Purple', shades: ['#F3E8FF', '#E9D5FF', '#D8B4FE', '#A855F7', '#9333EA', '#6B21A8'] },
    { label: 'Pink',   shades: ['#FCE7F3', '#FBCFE8', '#F9A8D4', '#EC4899', '#DB2777', '#9D174D'] },
];

const DEFAULT_SHAPE_COLOR = '#3B82F6';

const ColorPicker = ({ selectedColor, onChange, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const popupRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target) &&
                popupRef.current && !popupRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const openPicker = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const POPUP_H = 380; // estimated popup height
            const POPUP_W = 256;
            const GAP = 8;

            let top = rect.top;
            let left = rect.right + GAP;

            // Clamp: don't go below viewport
            if (top + POPUP_H > window.innerHeight - GAP) {
                top = window.innerHeight - POPUP_H - GAP;
            }
            // Clamp: don't go above viewport
            if (top < GAP) top = GAP;

            // If not enough room to the right, flip to the left
            if (left + POPUP_W > window.innerWidth - GAP) {
                left = rect.left - POPUP_W - GAP;
            }

            setPopupPos({ top, left });
        }
        setIsOpen((prev) => !prev);
    };

    const popup = isOpen ? createPortal(
        <div
            ref={popupRef}
            style={{ position: 'fixed', top: popupPos.top, left: popupPos.left, zIndex: 9999 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-[248px]"
        >
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Colors</div>
            <div className="flex flex-col gap-1">
                {COLOR_PALETTE.map((row) => (
                    <div key={row.label} className="flex items-center gap-1">
                        {row.shades.map((color) => (
                            <button
                                key={color}
                                onClick={() => { onChange(color); setIsOpen(false); }}
                                className={`w-[32px] h-[24px] rounded transition-all hover:scale-110 ${
                                    selectedColor === color
                                        ? 'ring-2 ring-indigo-500 ring-offset-1'
                                        : 'hover:ring-1 hover:ring-gray-300'
                                }`}
                                style={{ backgroundColor: color }}
                                title={`${row.label} – ${color}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
            {/* No-fill option */}
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                <button
                    onClick={() => { onChange('transparent'); setIsOpen(false); }}
                    className={`w-[32px] h-[24px] rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400 ${
                        selectedColor === 'transparent' ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                    }`}
                    title="No fill"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="4" y1="4" x2="20" y2="20" />
                    </svg>
                </button>
                <span className="text-[10px] text-gray-400">No fill</span>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className={`relative ${className}`}>
            <button
                ref={buttonRef}
                onClick={openPicker}
                className="w-8 h-8 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors shadow-sm"
                style={{ backgroundColor: selectedColor || DEFAULT_SHAPE_COLOR }}
                title="Pick color"
            />
            {popup}
        </div>
    );
};

export { COLOR_PALETTE, DEFAULT_SHAPE_COLOR };
export default ColorPicker;
