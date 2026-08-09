import { createPortal } from 'react-dom';
import { LINE_STYLES } from '../../utils/connectorMarkers';

const MARKERS = [
    { id: 'none', label: 'None' },
    { id: 'arrow', label: 'Arrow' },
    { id: 'openArrow', label: 'Open' },
    { id: 'triangle', label: 'Triangle' },
    { id: 'diamond', label: 'Diamond' },
    { id: 'filledDiamond', label: 'Filled ◆' },
];

const STYLE_LABELS = {
    solid: 'Solid',
    dashed: 'Dashed',
    dotted: 'Dotted',
};

const selectCls =
    'h-7 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-1 max-w-[108px] cursor-pointer';

function allowNativeControl(e) {
    const tag = e.target?.tagName;
    if (tag === 'SELECT' || tag === 'INPUT' || tag === 'OPTION' || tag === 'TEXTAREA') return;
    e.preventDefault();
}

const ConnectorStyleBar = ({ object, anchor, onChange }) => {
    if (!object || !anchor) return null;

    const isArrow = object.type === 'arrow';
    const startMarker = object.startMarker || 'none';
    const endMarker = object.endMarker || (isArrow ? 'arrow' : 'none');
    const lineStyle = object.lineStyle || 'solid';
    const strokeWidth = Number(object.strokeWidth) || 2;

    // Keep the bar on screen in both axes; narrow viewports fall back to scrolling it sideways.
    const top = Math.min(Math.max(8, anchor.top - 48), window.innerHeight - 56);
    const left = Math.max(8, Math.min(anchor.left, window.innerWidth - 540));

    return createPortal(
        <div
            className="fixed z-[1100] flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg max-w-[calc(100vw-1rem)] overflow-x-auto"
            style={{ top, left }}
            onMouseDown={allowNativeControl}
        >
            <label className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 px-0.5">Start</label>
            <select
                className={selectCls}
                value={startMarker}
                onChange={(e) => onChange({ startMarker: e.target.value })}
                title="Start marker"
            >
                {MARKERS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                ))}
            </select>

            <label className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 px-0.5">End</label>
            <select
                className={selectCls}
                value={endMarker}
                onChange={(e) => onChange({ endMarker: e.target.value })}
                title="End marker"
            >
                {MARKERS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                ))}
            </select>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

            <select
                className={selectCls}
                value={lineStyle}
                onChange={(e) => onChange({ lineStyle: e.target.value })}
                title="Line style"
            >
                {LINE_STYLES.map((s) => (
                    <option key={s} value={s}>{STYLE_LABELS[s]}</option>
                ))}
            </select>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

            <label className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 whitespace-nowrap">
                Width
            </label>
            <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={strokeWidth}
                onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
                className="w-20 accent-indigo-500 cursor-pointer"
                title="Stroke thickness"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300 w-3 tabular-nums">{strokeWidth}</span>
        </div>,
        document.body
    );
};

export default ConnectorStyleBar;
