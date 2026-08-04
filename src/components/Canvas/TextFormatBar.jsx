import { createPortal } from 'react-dom';

const FONTS = [
    { label: 'Geist', value: 'Geist Sans, system-ui, sans-serif' },
    { label: 'Satoshi', value: 'Satoshi, system-ui, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Mono', value: 'Geist Mono, ui-monospace, monospace' },
];

const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

const TEXT_TYPES = new Set(['text', 'sticky', 'rect', 'circle', 'triangle', 'diamond', 'ellipse']);

export function isTextCapable(obj) {
    return obj && TEXT_TYPES.has(obj.type);
}

/** Allow selects/inputs to receive focus; block focus steal on buttons only. */
function allowNativeControl(e) {
    const tag = e.target?.tagName;
    if (tag === 'SELECT' || tag === 'INPUT' || tag === 'OPTION' || tag === 'TEXTAREA') return;
    e.preventDefault();
}

const btnBase =
    'h-7 min-w-7 px-1.5 flex items-center justify-center rounded-[6px] text-xs font-semibold transition-colors';
const btnOff = `${btnBase} text-ink-muted hover:bg-surface-raised`;
const btnOn = `${btnBase} bg-accent-soft text-accent`;

const TextFormatBar = ({ object, anchor, onChange }) => {
    if (!object || !anchor) return null;

    const isTextType = object.type === 'text';
    const fontFamily = object.fontFamily || 'Geist Sans, system-ui, sans-serif';
    const fontSize = Number(object.fontSize) || (isTextType ? 20 : object.type === 'sticky' ? 16 : 14);
    const fontStyle = object.fontStyle || 'normal';
    const textDecoration = object.textDecoration || '';
    const align = object.align || (object.type === 'sticky' ? 'left' : 'center');

    const hasBold = fontStyle.includes('bold');
    const hasItalic = fontStyle.includes('italic');
    const hasUnderline = textDecoration === 'underline';

    const toggleBold = () => {
        let next = 'normal';
        if (hasBold && hasItalic) next = 'italic';
        else if (hasBold) next = 'normal';
        else if (hasItalic) next = 'bold italic';
        else next = 'bold';
        onChange({ fontStyle: next });
    };

    const toggleItalic = () => {
        let next = 'normal';
        if (hasBold && hasItalic) next = 'bold';
        else if (hasItalic) next = 'normal';
        else if (hasBold) next = 'bold italic';
        else next = 'italic';
        onChange({ fontStyle: next });
    };

    const toggleUnderline = () => {
        onChange({ textDecoration: hasUnderline ? '' : 'underline' });
    };

    const matchedFont = FONTS.find((f) => f.value === fontFamily)?.value || FONTS[0].value;
    const sizeOptions = SIZES.includes(fontSize) ? SIZES : [...SIZES, fontSize].sort((a, b) => a - b);

    const top = Math.max(8, anchor.top - 48);
    const left = Math.max(8, Math.min(anchor.left, window.innerWidth - 440));

    return createPortal(
        <div
            className="fixed z-[1100] flex items-center gap-1 px-2 py-1.5 rounded-[8px] border border-hairline bg-surface/95"
            style={{ top, left, boxShadow: 'var(--shadow-soft)' }}
            onMouseDown={allowNativeControl}
        >
            <button type="button" className={hasBold ? btnOn : btnOff} onClick={toggleBold} title="Bold">
                B
            </button>
            <button type="button" className={hasItalic ? btnOn : btnOff} onClick={toggleItalic} title="Italic">
                <span className="italic">I</span>
            </button>
            <button type="button" className={hasUnderline ? btnOn : btnOff} onClick={toggleUnderline} title="Underline">
                <span className="underline">U</span>
            </button>

            <div className="w-px h-5 bg-hairline mx-0.5" />

            <select
                className="h-7 text-xs rounded-[6px] border border-hairline bg-surface text-ink px-1 max-w-[120px] cursor-pointer"
                value={matchedFont}
                onChange={(e) => onChange({ fontFamily: e.target.value })}
                title="Font"
            >
                {FONTS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                ))}
            </select>

            <select
                className="h-7 text-xs rounded-[6px] border border-hairline bg-surface text-ink px-1 w-14 cursor-pointer"
                value={fontSize}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                title="Size"
            >
                {sizeOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>

            <div className="w-px h-5 bg-hairline mx-0.5" />

            {[
                { id: 'left', label: '⟸', title: 'Align left' },
                { id: 'center', label: '☰', title: 'Align center' },
                { id: 'right', label: '⟹', title: 'Align right' },
            ].map((a) => (
                <button
                    key={a.id}
                    type="button"
                    className={align === a.id ? btnOn : btnOff}
                    onClick={() => onChange({ align: a.id })}
                    title={a.title}
                >
                    {a.label}
                </button>
            ))}
        </div>,
        document.body
    );
};

export default TextFormatBar;
