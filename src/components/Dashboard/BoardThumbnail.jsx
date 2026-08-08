import { useMemo } from 'react';

const PAD = 28;
const DEFAULT_VIEW = { minX: 0, minY: 0, w: 800, h: 480 };

function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function pointsBounds(points) {
    if (!Array.isArray(points) || points.length < 2) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < points.length - 1; i += 2) {
        const x = num(points[i]);
        const y = num(points[i + 1]);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    if (!Number.isFinite(minX)) return null;
    return { minX, minY, maxX, maxY };
}

function objectBounds(obj) {
    if (!obj) return null;
    if (obj.type === 'line' || obj.type === 'arrow' || obj.type === 'freehand') {
        return pointsBounds(obj.points);
    }
    const x = num(obj.x);
    const y = num(obj.y);
    const w = Math.max(num(obj.width, 40), 8);
    const h = Math.max(num(obj.height, 40), 8);
    return { minX: x, minY: y, maxX: x + w, maxY: y + h };
}

function computeViewBox(objects) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let found = false;

    for (const obj of objects || []) {
        const b = objectBounds(obj);
        if (!b) continue;
        found = true;
        minX = Math.min(minX, b.minX);
        minY = Math.min(minY, b.minY);
        maxX = Math.max(maxX, b.maxX);
        maxY = Math.max(maxY, b.maxY);
    }

    if (!found) return DEFAULT_VIEW;

    const w = Math.max(maxX - minX, 120);
    const h = Math.max(maxY - minY, 80);
    return {
        minX: minX - PAD,
        minY: minY - PAD,
        w: w + PAD * 2,
        h: h + PAD * 2,
    };
}

function stickyFill(obj) {
    return obj.fill || obj.properties?.fill || 'var(--sticky)';
}

function shapeFill(obj) {
    return obj.fill || obj.properties?.fill || 'var(--surface)';
}

function shapeStroke(obj) {
    return obj.stroke || obj.properties?.stroke || 'var(--hairline-strong, #c8ced6)';
}

function PreviewNode({ obj }) {
    const x = num(obj.x);
    const y = num(obj.y);
    const w = Math.max(num(obj.width, 72), 12);
    const h = Math.max(num(obj.height, 48), 12);
    const text = (obj.text || obj.label || obj.properties?.text || obj.properties?.label || '').toString();

    if (obj.type === 'line' || obj.type === 'arrow' || obj.type === 'freehand') {
        const pts = Array.isArray(obj.points) ? obj.points : [];
        if (pts.length < 4) return null;
        const d = pts.reduce((acc, v, i) => {
            if (i % 2 === 0) return `${acc}${i === 0 ? 'M' : ' L'}${num(v)}`;
            return `${acc},${num(v)}`;
        }, '');
        const stroke = shapeStroke(obj);
        const sw = Math.max(num(obj.strokeWidth, 2), 1.5);
        return (
            <g>
                <path
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={sw}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={obj.type === 'freehand' ? 0.75 : 0.9}
                />
                {obj.type === 'arrow' && pts.length >= 4 && (
                    <circle
                        cx={num(pts[pts.length - 2])}
                        cy={num(pts[pts.length - 1])}
                        r={3}
                        fill={stroke}
                    />
                )}
            </g>
        );
    }

    if (obj.type === 'sticky') {
        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={4}
                    fill={stickyFill(obj)}
                    stroke="rgba(12,15,18,0.08)"
                    strokeWidth={1}
                />
                {text ? (
                    <foreignObject x={x + 6} y={y + 6} width={Math.max(w - 12, 8)} height={Math.max(h - 12, 8)}>
                        <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            style={{
                                fontSize: 11,
                                lineHeight: 1.25,
                                color: 'var(--sticky-ink)',
                                overflow: 'hidden',
                                height: '100%',
                                fontFamily: 'inherit',
                                wordBreak: 'break-word',
                            }}
                        >
                            {text}
                        </div>
                    </foreignObject>
                ) : null}
            </g>
        );
    }

    if (obj.type === 'umlClass') {
        const headerH = Math.min(18, h / 2);
        const name = (obj.className || obj.properties?.className || 'Class').toString();
        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={4}
                    fill={shapeFill(obj)}
                    stroke={shapeStroke(obj)}
                    strokeWidth={1}
                />
                <line
                    x1={x}
                    y1={y + headerH}
                    x2={x + w}
                    y2={y + headerH}
                    stroke={shapeStroke(obj)}
                    strokeWidth={1}
                />
                <text
                    x={x + w / 2}
                    y={y + headerH / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--ink, #111827)"
                >
                    {name}
                </text>
            </g>
        );
    }

    if (obj.type === 'icon') {
        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={8}
                    fill="var(--accent-soft)"
                    stroke="color-mix(in srgb, var(--accent) 35%, transparent)"
                    strokeWidth={1}
                />
                <text
                    x={x + w / 2}
                    y={y + h / 2 + 4}
                    textAnchor="middle"
                    fontSize={Math.min(14, w * 0.28)}
                    fill="var(--accent)"
                    fontWeight={600}
                >
                    {(text || '◆').slice(0, 8)}
                </text>
            </g>
        );
    }

    if (obj.type === 'circle' || obj.type === 'ellipse') {
        return (
            <ellipse
                cx={x + w / 2}
                cy={y + h / 2}
                rx={w / 2}
                ry={h / 2}
                fill={shapeFill(obj)}
                stroke={shapeStroke(obj)}
                strokeWidth={Math.max(num(obj.strokeWidth, 1.5), 1)}
            />
        );
    }

    if (obj.type === 'text') {
        return (
            <g>
                <rect x={x} y={y} width={w} height={h} rx={2} fill="transparent" />
                <text
                    x={x + 2}
                    y={y + Math.min(18, h * 0.55)}
                    fontSize={Math.min(16, Math.max(10, h * 0.45))}
                    fill="var(--ink)"
                    fontWeight={500}
                >
                    {(text || 'Text').slice(0, 28)}
                </text>
            </g>
        );
    }

    // rect / shape / default
    const rx = obj.type === 'diamond' ? 2 : 6;
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={rx}
                fill={shapeFill(obj)}
                stroke={shapeStroke(obj)}
                strokeWidth={Math.max(num(obj.strokeWidth, 1.5), 1)}
            />
            {text ? (
                <text
                    x={x + w / 2}
                    y={y + h / 2 + 4}
                    textAnchor="middle"
                    fontSize={Math.min(12, w * 0.18)}
                    fill="var(--ink)"
                    fontWeight={500}
                >
                    {text.slice(0, 18)}
                </text>
            ) : null}
        </g>
    );
}

// "tile" fills whatever box the caller sizes, so the parent owns the aspect ratio and border.
const FRAME_CLASSES = {
    card: 'h-[120px] w-full rounded-t-[10px] border-b border-hairline',
    banner: 'h-full min-h-[140px] w-full',
    tile: 'h-full w-full',
};

const DOT_SIZES = {
    card: '16px 16px',
    banner: '18px 18px',
    tile: '20px 20px',
};

/**
 * Live board thumbnail — scales real previewObjects into a dotted canvas frame.
 * size: "card" | "banner" | "tile"
 */
const BoardThumbnail = ({ objects, size = 'card', className = '' }) => {
    const items = useMemo(
        () => (Array.isArray(objects) ? objects.filter(Boolean).slice(0, 32) : []),
        [objects]
    );
    const view = useMemo(() => computeViewBox(items), [items]);
    const empty = items.length === 0;

    return (
        <div
            className={`relative overflow-hidden bg-canvas ${FRAME_CLASSES[size] || FRAME_CLASSES.card} ${className}`}
            style={{
                backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 0.7px, transparent 0.7px)',
                backgroundSize: DOT_SIZES[size] || DOT_SIZES.card,
            }}
            aria-hidden="true"
        >
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'linear-gradient(160deg, transparent 45%, color-mix(in srgb, var(--accent) 5%, transparent) 100%)',
                }}
            />

            {empty ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] text-ink-faint/80 font-medium tracking-wide">
                        Empty canvas
                    </span>
                </div>
            ) : (
                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox={`${view.minX} ${view.minY} ${view.w} ${view.h}`}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {items.map((obj) => (
                        <PreviewNode key={obj.id || `${obj.type}-${obj.x}-${obj.y}`} obj={obj} />
                    ))}
                </svg>
            )}
        </div>
    );
};

export default BoardThumbnail;
