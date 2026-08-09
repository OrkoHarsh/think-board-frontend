/**
 * Popover shown when Line or Arrow tool is activated — pick style before drawing.
 */
const LINE_PRESETS = [
    {
        id: 'solid',
        label: 'Solid',
        hint: 'Association',
        preview: '────',
        props: { lineStyle: 'solid', startMarker: 'none', endMarker: 'none' },
    },
    {
        id: 'arrow',
        label: 'Arrow',
        hint: 'Directed',
        preview: '───▶',
        props: { lineStyle: 'solid', startMarker: 'none', endMarker: 'arrow' },
    },
    {
        id: 'dashed',
        label: 'Dashed',
        hint: 'Dependency',
        preview: '- - ▶',
        props: { lineStyle: 'dashed', startMarker: 'none', endMarker: 'openArrow' },
    },
    {
        id: 'composition',
        label: 'Compose',
        hint: 'Composition',
        preview: '◆──▶',
        props: { lineStyle: 'solid', startMarker: 'filledDiamond', endMarker: 'arrow' },
    },
];

const ARROW_PRESETS = [
    {
        id: 'arrow',
        label: 'Arrow',
        hint: 'Directed',
        preview: '───▶',
        props: { lineStyle: 'solid', startMarker: 'none', endMarker: 'arrow' },
    },
    {
        id: 'generalize',
        label: 'Extend',
        hint: 'Generalization',
        preview: '───▷',
        props: { lineStyle: 'solid', startMarker: 'none', endMarker: 'triangle' },
    },
    {
        id: 'aggregate',
        label: 'Aggregate',
        hint: 'Aggregation',
        preview: '◇──▶',
        props: { lineStyle: 'solid', startMarker: 'diamond', endMarker: 'arrow' },
    },
    {
        id: 'dashed',
        label: 'Dashed',
        hint: 'Realization',
        preview: '- - ▷',
        props: { lineStyle: 'dashed', startMarker: 'none', endMarker: 'triangle' },
    },
];

const LineToolPicker = ({ tool, value, onChange, onClose }) => {
    if (tool !== 'line' && tool !== 'arrow') return null;

    const presets = tool === 'arrow' ? ARROW_PRESETS : LINE_PRESETS;
    const activeId =
        presets.find(
            (p) =>
                p.props.lineStyle === (value?.lineStyle || 'solid') &&
                p.props.startMarker === (value?.startMarker || 'none') &&
                p.props.endMarker === (value?.endMarker || (tool === 'arrow' ? 'arrow' : 'none'))
        )?.id || presets[0].id;

    return (
        <div
            className="absolute bottom-24 lg:bottom-20 left-1/2 -translate-x-1/2 z-30 w-52 max-w-[calc(100vw-1.5rem)] rounded-[8px] border border-hairline bg-surface/95 p-2"
            style={{ boxShadow: 'var(--shadow-soft)' }}
        >
            <div className="flex items-center justify-between px-1 mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    {tool === 'arrow' ? 'Arrow style' : 'Line style'}
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-ink-faint hover:text-ink text-xs px-1"
                    title="Close"
                >
                    ✕
                </button>
            </div>
            <div className="flex flex-col gap-1">
                {presets.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => onChange({ ...p.props })}
                        className={`flex items-center gap-2 rounded-[6px] px-2 py-2 text-left transition-colors ${
                            activeId === p.id
                                ? 'bg-accent-soft ring-1 ring-accent/40'
                                : 'hover:bg-surface-raised'
                        }`}
                    >
                        <span className="w-12 text-center font-mono text-sm text-ink tabular-nums">
                            {p.preview}
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="block text-xs font-semibold text-ink">{p.label}</span>
                            <span className="block text-[10px] text-ink-faint">{p.hint}</span>
                        </span>
                    </button>
                ))}
            </div>
            <p className="mt-2 px-1 text-[10px] text-ink-faint">
                Draw on the canvas, then tweak markers anytime after selecting the line.
            </p>
        </div>
    );
};

export default LineToolPicker;
export { LINE_PRESETS, ARROW_PRESETS };
