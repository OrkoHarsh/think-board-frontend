import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shared product-frame mock — proves calm chrome, bright canvas, and think-together.
 * Cards are draggable for a live, playable preview.
 * size: "hero" (landing) | "aside" (auth panels)
 */
const TOOLS = ['Select', 'Sticky', 'Shape', 'Pen'];

/** Positions as % of canvas — works for hero and aside sizes */
const INITIAL_NODES = [
    {
        id: 'discovery',
        x: 6,
        y: 10,
        w: 30,
        type: 'card',
        title: 'Discovery',
        sub: 'User interviews',
        tone: 'surface',
    },
    {
        id: 'build',
        x: 42,
        y: 14,
        w: 32,
        type: 'card',
        title: 'Build',
        sub: 'MVP scope',
        tone: 'accent',
    },
    {
        id: 'sticky',
        x: 10,
        y: 48,
        w: 34,
        type: 'sticky',
        title: 'Map Q3 bets before Friday sync',
        tone: 'sticky',
        rotate: -2,
    },
    {
        id: 'launch',
        x: 62,
        y: 58,
        w: 26,
        type: 'card',
        title: 'Launch',
        sub: 'Week 6',
        tone: 'surface',
    },
    {
        id: 'suggest',
        x: 58,
        y: 8,
        w: 30,
        type: 'suggest',
        title: 'Group by phase',
        sub: 'Suggested',
        tone: 'suggest',
    },
];

function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}

const BoardPreview = ({ size = 'aside', className = '' }) => {
    const isHero = size === 'hero';
    const chromeH = isHero ? 'h-11' : 'h-10';
    const canvasH = isHero ? 'h-[280px] sm:h-[340px]' : 'h-[240px] sm:h-[280px]';
    const titleSize = isHero ? 'text-[13px]' : 'text-[12px]';
    const avatar = isHero ? 'w-6 h-6 text-[10px]' : 'w-5 h-5 text-[9px]';
    const shareH = isHero ? 'h-7 px-2.5 text-[12px]' : 'h-6 px-2 text-[10px]';
    const toolH = isHero ? 'h-8 px-2.5 text-[11px]' : 'h-7 px-2 text-[10px]';
    const nodePad = isHero ? 'px-3 py-2' : 'px-2.5 py-2';
    const nodeTitle = isHero ? 'text-[11px]' : 'text-[10px]';
    const nodeSub = isHero ? 'text-[10px]' : 'text-[9px]';

    const canvasRef = useRef(null);
    const dragRef = useRef(null);
    const nodesRef = useRef(INITIAL_NODES);
    const [nodes, setNodes] = useState(INITIAL_NODES);
    const [activeId, setActiveId] = useState(null);
    const [cursor, setCursor] = useState({ x: 48, y: 42 });
    const [hint, setHint] = useState(true);

    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    // Alex presence drifts toward Build — live collaboration vibe
    useEffect(() => {
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return undefined;

        let frame;
        let t = 0;
        const tick = () => {
            t += 0.008;
            const build = nodesRef.current.find((n) => n.id === 'build');
            const targetX = (build?.x ?? 42) + (build?.w ?? 32) * 0.55;
            const targetY = (build?.y ?? 14) + 22;
            setCursor((prev) => ({
                x: prev.x + (targetX + Math.sin(t) * 3 - prev.x) * 0.04,
                y: prev.y + (targetY + Math.cos(t * 0.8) * 2 - prev.y) * 0.04,
            }));
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, []);

    const onPointerDown = useCallback((e, id) => {
        if (!canvasRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = canvasRef.current.getBoundingClientRect();
        const node = nodesRef.current.find((n) => n.id === id);
        if (!node) return;

        const pointerX = ((e.clientX - rect.left) / rect.width) * 100;
        const pointerY = ((e.clientY - rect.top) / rect.height) * 100;

        dragRef.current = {
            id,
            offsetX: pointerX - node.x,
            offsetY: pointerY - node.y,
        };
        setActiveId(id);
        setHint(false);
        e.currentTarget.setPointerCapture(e.pointerId);
    }, []);

    const onPointerMove = useCallback((e) => {
        const drag = dragRef.current;
        if (!drag || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const pointerX = ((e.clientX - rect.left) / rect.width) * 100;
        const pointerY = ((e.clientY - rect.top) / rect.height) * 100;
        const node = nodesRef.current.find((n) => n.id === drag.id);
        const maxX = 100 - (node?.w ?? 28);
        const maxY = 72;

        setNodes((prev) =>
            prev.map((n) =>
                n.id === drag.id
                    ? {
                          ...n,
                          x: clamp(pointerX - drag.offsetX, 1, maxX),
                          y: clamp(pointerY - drag.offsetY, 2, maxY),
                      }
                    : n
            )
        );
    }, []);

    const onPointerUp = useCallback((e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        setActiveId(null);
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            /* already released */
        }
    }, []);

    const toneClass = {
        surface: 'border-hairline bg-surface',
        accent: 'border-accent/30 bg-accent-soft',
        sticky: 'border-hairline bg-sticky',
        suggest: 'border-dashed border-accent/40 bg-accent-soft/90',
    };

    return (
        <div
            className={`relative rounded-[10px] border border-hairline bg-surface overflow-hidden nimbus-animate-frame ${className}`}
            style={{
                boxShadow: isHero ? 'var(--shadow-soft)' : 'var(--preview-shadow)',
            }}
        >
            <div className={`${chromeH} border-b border-hairline flex items-center justify-between px-3 bg-surface`}>
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`${isHero ? 'w-6 h-6' : 'w-5 h-5'} rounded-md bg-surface-raised shrink-0`} />
                    <span className={`${titleSize} font-medium text-ink truncate`}>Product roadmap</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex -space-x-1.5">
                        <div
                            className={`${avatar} rounded-full bg-accent text-on-accent font-medium flex items-center justify-center ring-2 ring-surface relative`}
                        >
                            A
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success ring-2 ring-surface nimbus-animate-presence" />
                        </div>
                        <div
                            className={`${avatar} rounded-full bg-ink-faint text-on-accent font-medium flex items-center justify-center ring-2 ring-surface`}
                        >
                            B
                        </div>
                    </div>
                    <div
                        className={`${shareH} rounded-md bg-accent text-on-accent font-medium flex items-center`}
                    >
                        Share
                    </div>
                </div>
            </div>

            <div
                ref={canvasRef}
                className={`relative ${canvasH} bg-canvas touch-none select-none`}
                style={{
                    backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 0.8px, transparent 0.8px)',
                    backgroundSize: isHero ? '20px 20px' : '18px 18px',
                }}
            >
                {hint && (
                    <p className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-[10px] sm:text-[11px] text-ink-faint bg-surface/90 border border-hairline rounded-full px-2.5 py-0.5 nimbus-animate-presence">
                        Drag cards to rearrange
                    </p>
                )}

                {nodes.map((node, index) => {
                    const isActive = activeId === node.id;
                    const base =
                        node.type === 'sticky'
                            ? `${nodePad} rounded-lg`
                            : node.type === 'suggest'
                              ? `${nodePad} rounded-md`
                              : `${nodePad} rounded-lg`;

                    return (
                        <div
                            key={node.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Move ${node.title}`}
                            onPointerDown={(e) => onPointerDown(e, node.id)}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                            className={`absolute ${base} border ${toneClass[node.tone]} cursor-grab active:cursor-grabbing transition-[box-shadow,transform] duration-150 ${
                                isActive ? 'z-20 scale-[1.03] nimbus-preview-lift' : 'z-10 hover:scale-[1.02]'
                            } ${!isActive && !activeId ? 'nimbus-preview-idle' : ''}`}
                            style={{
                                left: `${node.x}%`,
                                top: `${node.y}%`,
                                width: `${node.w}%`,
                                boxShadow: isActive
                                    ? '0 10px 28px rgba(12,15,18,0.16)'
                                    : 'var(--shadow-soft)',
                                transform: node.rotate
                                    ? `rotate(${node.rotate}deg)${isActive ? ' scale(1.03)' : ''}`
                                    : undefined,
                                animationDelay: `${index * 0.35}s`,
                                touchAction: 'none',
                            }}
                        >
                            {node.type === 'suggest' ? (
                                <>
                                    <div className={`${nodeSub} font-medium text-accent tracking-wide uppercase`}>
                                        {node.sub}
                                    </div>
                                    <div className={`${nodeTitle} text-ink mt-0.5 leading-snug`}>{node.title}</div>
                                </>
                            ) : node.type === 'sticky' ? (
                                <div className={`${nodeTitle} text-sticky-ink leading-snug`}>{node.title}</div>
                            ) : (
                                <>
                                    <div
                                        className={`${nodeTitle} font-medium ${
                                            node.tone === 'accent' ? 'text-accent' : 'text-ink'
                                        }`}
                                    >
                                        {node.title}
                                    </div>
                                    <div
                                        className={`${nodeSub} mt-0.5 ${
                                            node.tone === 'accent' ? 'text-ink-muted' : 'text-ink-faint'
                                        }`}
                                    >
                                        {node.sub}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}

                {/* Presence cursor — follows Build */}
                <div
                    className="absolute z-[15] pointer-events-none transition-opacity duration-300"
                    style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
                    aria-hidden="true"
                >
                    <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                        <path
                            d="M1 1l11 6.5-5.2 1.4L5.2 16 1 1z"
                            fill="var(--accent)"
                            stroke="var(--surface)"
                            strokeWidth="1"
                        />
                    </svg>
                    <span className="ml-2 -mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-accent text-on-accent">
                        Alex
                    </span>
                </div>

                {/* Tool rail */}
                <div
                    className={`absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-1 sm:py-1.5 rounded-lg border border-hairline bg-surface/95 nimbus-animate-rail pointer-events-none`}
                >
                    {TOOLS.map((t, i) => (
                        <div
                            key={t}
                            className={`${toolH} rounded-md font-medium flex items-center ${
                                i === 0 ? 'bg-accent-soft text-accent' : 'text-ink-muted'
                            }`}
                        >
                            {t}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BoardPreview;
