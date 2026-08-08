import { useState, useEffect, useLayoutEffect, useRef, forwardRef, useImperativeHandle, useCallback, memo, useMemo } from 'react';
import { Stage, Layer, Line, Arrow as KonvaArrow, Rect as KonvaRect, Transformer, Group, Path, Rect as KonvaRectLabel, Text as KonvaText } from 'react-konva';
import Shape from './Shape';
import StickyNote from './StickyNote';
import UmlClassNode from './UmlClassNode';
import Connector from './Connector';
import AnimatedConnector from './AnimatedConnector';
import AnimatedIconNode from './AnimatedIconNode';
import AnimatedRect from './AnimatedRect';
import TextFormatBar, { isTextCapable, toggleBoldStyle, toggleItalicStyle } from './TextFormatBar';
import ConnectorStyleBar from './ConnectorStyleBar';
import { generateId } from '../../utils/helpers';

const DRAW_TOOLS = ['line', 'arrow', 'freehand'];
const LASER_FADE_MS = 900;

/** Objects + selection UI — memoized so remote cursor ticks don't reset Konva drag positions */
const ObjectsLayer = memo(function ObjectsLayer({
    objects,
    selectedIds,
    animKey,
    isAnimating,
    stageScale,
    selBox,
    drawPreview,
    onObjSelect,
    onUpdate,
    trRef,
}) {
    return (
        <Layer>
            {(objects || []).map((obj, idx) => {
                const isSelected = selectedIds.includes(obj.id);
                const isDiagramObject = obj.id.startsWith('icon-') || obj.id.startsWith('node-') || obj.id.startsWith('arrow-');
                const pulseDelay = idx * 0.08;

                if (obj.type === 'sticky') {
                    return (
                        <StickyNote
                            key={`${obj.id}-sticky-${animKey}`}
                            noteProps={obj}
                            isSelected={isSelected}
                            onSelect={(e) => onObjSelect(obj.id, e)}
                            onChange={(a) => onUpdate(obj.id, a)}
                        />
                    );
                }
                if (obj.type === 'umlClass') {
                    return (
                        <UmlClassNode
                            key={`${obj.id}-uml-${animKey}`}
                            nodeProps={obj}
                            isSelected={isSelected}
                            onSelect={(e) => onObjSelect(obj.id, e)}
                            onChange={(a) => onUpdate(obj.id, a)}
                        />
                    );
                }
                if (obj.type === 'line' || obj.type === 'arrow' || obj.type === 'freehand') {
                    if (obj.type === 'arrow') {
                        return (
                            <AnimatedConnector
                                key={`${obj.id}-arrow-${animKey}`}
                                connectorProps={obj}
                                isSelected={isSelected}
                                onSelect={(e) => onObjSelect(obj.id, e)}
                                onChange={(a) => onUpdate(obj.id, a)}
                                isAnimating={isAnimating}
                            />
                        );
                    }
                    return (
                        <Connector
                            key={`${obj.id}-conn-${animKey}`}
                            connectorProps={obj}
                            isSelected={isSelected}
                            onSelect={(e) => onObjSelect(obj.id, e)}
                            onChange={(a) => onUpdate(obj.id, a)}
                        />
                    );
                }
                if (obj.type === 'icon') {
                    return (
                        <AnimatedIconNode
                            key={`${obj.id}-icon-${animKey}`}
                            iconProps={obj}
                            isSelected={isSelected}
                            onSelect={(e) => onObjSelect(obj.id, e)}
                            onChange={(a) => onUpdate(obj.id, a)}
                            pulseDelay={pulseDelay}
                            isAnimating={isAnimating}
                            diagramMode={obj.id.startsWith('ai-') || obj.id.startsWith('icon-')}
                        />
                    );
                }
                if (isDiagramObject && obj.type === 'rect') {
                    return (
                        <AnimatedRect
                            key={`${obj.id}-rect-${animKey}`}
                            shapeProps={obj}
                            isSelected={isSelected}
                            onSelect={(e) => onObjSelect(obj.id, e)}
                            onChange={(a) => onUpdate(obj.id, a)}
                            pulseDelay={pulseDelay}
                            isAnimating={isAnimating}
                        />
                    );
                }
                return (
                    <Shape
                        key={`${obj.id}-shape-${animKey}`}
                        shapeProps={obj}
                        isSelected={isSelected}
                        onSelect={(e) => onObjSelect(obj.id, e)}
                        onChange={(a) => onUpdate(obj.id, a)}
                        isAnimating={isAnimating}
                        pulseDelay={pulseDelay}
                    />
                );
            })}

            <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) =>
                    newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
                }
            />

            {selBox && selBox.w > 2 && selBox.h > 2 && (
                <KonvaRect
                    x={selBox.x} y={selBox.y}
                    width={selBox.w} height={selBox.h}
                    fill="rgba(99,102,241,0.08)"
                    stroke="#6366f1"
                    strokeWidth={1 / stageScale}
                    dash={[4 / stageScale, 3 / stageScale]}
                    listening={false}
                />
            )}
            {drawPreview}
        </Layer>
    );
});

/** Remote collaborator cursors — updates independently of object layer */
const CursorsLayer = memo(function CursorsLayer({ remoteCursors, stageScale, stagePos }) {
    return (
        <Layer listening={false}>
            {Object.values(remoteCursors).map(({ userId, name, color, x, y }) => {
                const sx = x * stageScale + stagePos.x;
                const sy = y * stageScale + stagePos.y;
                const labelW = Math.max(40, name.length * 7 + 12);
                return (
                    <Group key={userId} x={sx} y={sy} listening={false}>
                        <Path
                            data="M0,0 L0,18 L5,13 L8,20 L10,19 L7,12 L12,12 Z"
                            fill={color}
                            stroke="white"
                            strokeWidth={1}
                        />
                        <KonvaRectLabel
                            x={10} y={14}
                            width={labelW} height={18}
                            fill={color}
                            cornerRadius={3}
                        />
                        <KonvaText
                            x={14} y={18}
                            text={name}
                            fontSize={11}
                            fontFamily="Inter, system-ui, sans-serif"
                            fill="white"
                            listening={false}
                        />
                    </Group>
                );
            })}
        </Layer>
    );
});

const CanvasStage = forwardRef(({
    objects,
    onUpdate,
    onSelect,
    onDelete,
    onAdd,
    activeTool,
    drawColor = '#3B82F6',
    connectorDefaults = {
        lineStyle: 'solid',
        startMarker: 'none',
        endMarker: 'none',
        strokeWidth: 2,
    },
    stageScale,
    stagePos,
    setStageScale,
    setStagePos,
    remoteCursors = {},
    onCursorMove,
    animKey = 0,
    isAnimating = false,
    onUndo,
    onRedo,
    onBeforeMutate,
}, ref) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawPoints, setDrawPoints] = useState([]);
    const [laserTrails, setLaserTrails] = useState([]);
    const [selectionBox, setSelectionBox] = useState(null);
    const [isDraggingSelect, setIsDraggingSelect] = useState(false);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const stageRef = useRef();
    const containerRef = useRef();
    const trRef = useRef();
    const selectionStartRef = useRef(null);
    const lastClickPosRef = useRef(null);
    const cycleIndexRef = useRef(0);
    const lastPositionsRef = useRef({});
    const prevCountRef = useRef(0);
    const laserActiveRef = useRef(null);

    // Debug: log when objects change
    useEffect(() => {
        console.log('>>> CanvasStage: objects array =', objects);
        console.log('>>> CanvasStage: objects length =', objects?.length);
        console.log('>>> CanvasStage: objects types =', objects?.map(o => `${o.type}(${o.id})`));
        if (objects.length !== prevCountRef.current) {
            console.log('>>> CanvasStage: objects CHANGED from', prevCountRef.current, 'to', objects.length);
            prevCountRef.current = objects.length;
        }
    }, [objects]);

    // Export methods via forwardRef
    useImperativeHandle(ref, () => ({
        exportImage: () => stageRef.current?.toDataURL({ pixelRatio: 2 }) || null,
        getStage: () => stageRef.current,
    }), []);

    const isDrawMode = DRAW_TOOLS.includes(activeTool);
    const isLaserMode = activeTool === 'laser';
    const isPanMode = activeTool === 'hand';
    const isSelectMode = activeTool === 'select';

    // Measure container size on mount and resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setStageSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Sync shared Transformer to selected Konva nodes (exclude lines/arrows)
    useLayoutEffect(() => {
        if (!trRef.current || !stageRef.current) return;
        const nodes = selectedIds
            .flatMap(id => stageRef.current.find('#' + id))
            .filter(Boolean)
            .filter(node => {
                const obj = objects.find(o => o.id === node.id());
                return !['line', 'arrow', 'freehand'].includes(obj?.type);
            });
        trRef.current.nodes(nodes);
        trRef.current.getLayer()?.batchDraw();
    }, [selectedIds, objects]);

    // Keep track of latest positions for arrow key handler (avoid stale closures)
    useEffect(() => {
        lastPositionsRef.current = objects.reduce((map, obj) => {
            map[obj.id] = { x: obj.x || 0, y: obj.y || 0 };
            return map;
        }, {});
    }, [objects]);

    // Fade laser trails
    useEffect(() => {
        if (!laserTrails.length) return undefined;
        const id = window.setInterval(() => {
            const now = Date.now();
            setLaserTrails((prev) => prev.filter((t) => now - t.born < LASER_FADE_MS));
        }, 50);
        return () => window.clearInterval(id);
    }, [laserTrails.length]);

    // Keyboard: Delete, arrows, formatting, undo/redo
    useEffect(() => {
        const handleKeyDown = (e) => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

            const mod = e.ctrlKey || e.metaKey;

            if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                onUndo?.();
                return;
            }
            if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
                e.preventDefault();
                onRedo?.();
                return;
            }

            if (mod && selectedIds.length) {
                const key = e.key.toLowerCase();
                if (key === 'b' || key === 'i' || key === 'u') {
                    e.preventDefault();
                    selectedIds.forEach((id) => {
                        const obj = objects.find((o) => o.id === id);
                        if (!isTextCapable(obj)) return;
                        if (key === 'b') onUpdate(id, { fontStyle: toggleBoldStyle(obj.fontStyle) });
                        if (key === 'i') onUpdate(id, { fontStyle: toggleItalicStyle(obj.fontStyle) });
                        if (key === 'u') {
                            onUpdate(id, {
                                textDecoration: obj.textDecoration === 'underline' ? '' : 'underline',
                            });
                        }
                    });
                    return;
                }
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length) {
                selectedIds.forEach(id => onDelete(id));
                setSelectedIds([]);
                onSelect(null);
                return;
            }

            if (!selectedIds.length) return;
            const STEP = e.shiftKey ? 10 : 1;
            let dx = 0, dy = 0;
            if (e.key === 'ArrowLeft')  { dx = -STEP; e.preventDefault(); }
            if (e.key === 'ArrowRight') { dx =  STEP; e.preventDefault(); }
            if (e.key === 'ArrowUp')    { dy = -STEP; e.preventDefault(); }
            if (e.key === 'ArrowDown')  { dy =  STEP; e.preventDefault(); }
            if (dx === 0 && dy === 0) return;

            selectedIds.forEach(id => {
                const pos = lastPositionsRef.current[id] || { x: 0, y: 0 };
                onUpdate(id, { x: pos.x + dx, y: pos.y + dy });
            });
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, onDelete, onUpdate, onSelect, objects, onUndo, onRedo, onBeforeMutate]);

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        // Wheel / trackpad: deltaY > 0 → zoom in; browsers send ctrlKey on pinch
        let direction = e.evt.deltaY > 0 ? 1 : -1;
        if (e.evt.ctrlKey) direction = -direction;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        setStageScale(newScale);
        setStagePos({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    };

    const getWorldPos = (pointerPos) => ({
        x: (pointerPos.x - stagePos.x) / stageScale,
        y: (pointerPos.y - stagePos.y) / stageScale,
    });

    const getObjBBox = (obj) => {
        if (obj.type === 'line' || obj.type === 'arrow' || obj.type === 'freehand') {
            const pts = obj.points || [];
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < pts.length; i += 2) {
                minX = Math.min(minX, pts[i]); minY = Math.min(minY, pts[i + 1]);
                maxX = Math.max(maxX, pts[i]); maxY = Math.max(maxY, pts[i + 1]);
            }
            return { x: (obj.x || 0) + minX, y: (obj.y || 0) + minY, width: maxX - minX, height: maxY - minY };
        }
        return { x: obj.x || 0, y: obj.y || 0, width: obj.width || 150, height: obj.height || 150 };
    };

    const handleObjSelect = useCallback((objId, e) => {
        if (activeTool === 'eraser') { onDelete(objId); return; }

        // Alt+click: cycle through overlapping objects
        if (e?.evt?.altKey) {
            const stage = stageRef.current;
            const pointerPos = stage.getPointerPosition();
            const pos = {
                x: (pointerPos.x - stagePos.x) / stageScale,
                y: (pointerPos.y - stagePos.y) / stageScale,
            };

            const isSamePosClick = lastClickPosRef.current &&
                Math.abs(lastClickPosRef.current.x - pos.x) < 10 &&
                Math.abs(lastClickPosRef.current.y - pos.y) < 10;

            const overlappingIds = objects
                .filter(obj => {
                    const bbox = getObjBBox(obj);
                    return pos.x >= bbox.x && pos.x <= bbox.x + bbox.width &&
                           pos.y >= bbox.y && pos.y <= bbox.y + bbox.height;
                })
                .map(obj => obj.id);

            if (overlappingIds.length > 1) {
                if (!isSamePosClick) {
                    cycleIndexRef.current = 0;
                }
                const currentIdx = overlappingIds.indexOf(selectedIds[0]);
                const nextIdx = (currentIdx + 1) % overlappingIds.length;
                cycleIndexRef.current = nextIdx;
                setSelectedIds([overlappingIds[nextIdx]]);
                onSelect(overlappingIds[nextIdx]);
            } else {
                setSelectedIds([objId]);
                onSelect(objId);
            }

            lastClickPosRef.current = pos;
            return;
        }

        lastClickPosRef.current = null;
        cycleIndexRef.current = 0;

        if (e?.evt?.shiftKey) {
            setSelectedIds(prev =>
                prev.includes(objId) ? prev.filter(id => id !== objId) : [...prev, objId]
            );
        } else {
            setSelectedIds([objId]);
        }
        onSelect(objId);
    }, [activeTool, onDelete, onSelect, objects, selectedIds, stagePos.x, stagePos.y, stageScale]);

    const handleMouseDown = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (!clickedOnEmpty && !isLaserMode) return;

        if (isLaserMode) {
            const pos = getWorldPos(e.target.getStage().getPointerPosition());
            const trail = { id: generateId(), points: [pos.x, pos.y], born: Date.now() };
            laserActiveRef.current = trail.id;
            setLaserTrails((prev) => [...prev, trail]);
            return;
        }

        if (!clickedOnEmpty) return;

        if (isDrawMode) {
            setIsDrawing(true);
            const pos = getWorldPos(e.target.getStage().getPointerPosition());
            setDrawPoints([pos.x, pos.y]);
            return;
        }

        if (isSelectMode) {
            const pos = getWorldPos(e.target.getStage().getPointerPosition());
            selectionStartRef.current = pos;
            setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
            setIsDraggingSelect(true);
            if (!e.evt.shiftKey) {
                setSelectedIds([]);
                onSelect(null);
            }
            return;
        }

        setSelectedIds([]);
        onSelect(null);
    };

    const handleMouseMove = (e) => {
        const pos = getWorldPos(e.target.getStage().getPointerPosition());

        // Emit cursor position to collaborators
        if (onCursorMove) onCursorMove(pos.x, pos.y);

        if (isLaserMode && laserActiveRef.current) {
            const activeId = laserActiveRef.current;
            setLaserTrails((prev) =>
                prev.map((t) =>
                    t.id === activeId ? { ...t, points: [...t.points, pos.x, pos.y], born: Date.now() } : t
                )
            );
            return;
        }

        if (isDrawing) {
            if (activeTool === 'freehand') {
                setDrawPoints(prev => [...prev, pos.x, pos.y]);
            } else {
                setDrawPoints(prev => [prev[0], prev[1], pos.x, pos.y]);
            }
            return;
        }
        if (isDraggingSelect && selectionStartRef.current) {
            setSelectionBox({ x1: selectionStartRef.current.x, y1: selectionStartRef.current.y, x2: pos.x, y2: pos.y });
        }
    };

    const handleMouseUp = () => {
        if (isLaserMode) {
            laserActiveRef.current = null;
            return;
        }

        if (isDrawing) {
            setIsDrawing(false);
            if (drawPoints.length >= 4) {
                const base = {
                    id: generateId(),
                    type: activeTool,
                    points: [...drawPoints],
                    x: 0,
                    y: 0,
                    stroke: (!drawColor || drawColor === 'transparent') ? '#374151' : drawColor,
                    strokeWidth: connectorDefaults.strokeWidth || 2,
                    lineStyle: connectorDefaults.lineStyle || 'solid',
                    startMarker: connectorDefaults.startMarker || 'none',
                    endMarker:
                        connectorDefaults.endMarker ||
                        (activeTool === 'arrow' ? 'arrow' : 'none'),
                };
                if (activeTool === 'arrow' || activeTool === 'line') {
                    onAdd(base);
                } else {
                    onAdd({
                        id: base.id,
                        type: activeTool,
                        points: base.points,
                        x: 0,
                        y: 0,
                        stroke: base.stroke,
                        strokeWidth: base.strokeWidth,
                    });
                }
            }
            setDrawPoints([]);
            return;
        }

        if (isDraggingSelect && selectionBox) {
            const rx1 = Math.min(selectionBox.x1, selectionBox.x2);
            const ry1 = Math.min(selectionBox.y1, selectionBox.y2);
            const rx2 = Math.max(selectionBox.x1, selectionBox.x2);
            const ry2 = Math.max(selectionBox.y1, selectionBox.y2);

            if (rx2 - rx1 > 5 || ry2 - ry1 > 5) {
                const newIds = objects
                    .filter(obj => {
                        const b = getObjBBox(obj);
                        return b.x < rx2 && b.x + b.width > rx1 && b.y < ry2 && b.y + b.height > ry1;
                    })
                    .map(o => o.id);
                setSelectedIds(newIds);
            }
            setIsDraggingSelect(false);
            setSelectionBox(null);
            selectionStartRef.current = null;
        }
    };

    // Adaptive grid
    const logScale = Math.log2(stageScale);
    const scalePower = Math.floor(logScale);
    const adjustedGridStep = 20 / Math.pow(2, scalePower);
    const visualGridSize = adjustedGridStep * stageScale;

    const selBox = selectionBox ? {
        x: Math.min(selectionBox.x1, selectionBox.x2),
        y: Math.min(selectionBox.y1, selectionBox.y2),
        w: Math.abs(selectionBox.x2 - selectionBox.x1),
        h: Math.abs(selectionBox.y2 - selectionBox.y1),
    } : null;

    const renderDrawPreview = () => {
        const now = Date.now();
        const lasers = laserTrails.map((trail) => {
            if (!trail.points || trail.points.length < 4) return null;
            const age = now - trail.born;
            const opacity = Math.max(0, 1 - age / LASER_FADE_MS);
            return (
                <Group key={trail.id} listening={false} opacity={opacity}>
                    <Line
                        points={trail.points}
                        stroke="#ff1a4a"
                        strokeWidth={8}
                        lineCap="round"
                        lineJoin="round"
                        tension={0.4}
                        opacity={0.55}
                        shadowColor="#ff0040"
                        shadowBlur={18}
                        shadowOpacity={0.9}
                        listening={false}
                    />
                    <Line
                        points={trail.points}
                        stroke="#ffffff"
                        strokeWidth={2.5}
                        lineCap="round"
                        lineJoin="round"
                        tension={0.4}
                        listening={false}
                    />
                </Group>
            );
        });

        let preview = null;
        if (isDrawing && drawPoints.length >= 4) {
            const stroke = (!drawColor || drawColor === 'transparent') ? '#6366f1' : drawColor;
            const previewProps = { points: drawPoints, stroke, strokeWidth: 2, dash: [6, 3], listening: false };
            if (activeTool === 'arrow') {
                preview = (
                    <KonvaArrow
                        points={drawPoints}
                        stroke={stroke}
                        fill={stroke}
                        strokeWidth={2}
                        pointerLength={10}
                        pointerWidth={10}
                        dash={[6, 3]}
                        listening={false}
                    />
                );
            } else if (activeTool === 'freehand') {
                preview = <Line {...previewProps} tension={0.5} lineCap="round" lineJoin="round" dash={undefined} opacity={0.6} />;
            } else {
                preview = <Line {...previewProps} />;
            }
        }

        return (
            <>
                {lasers}
                {preview}
            </>
        );
    };

    const selectedObject = useMemo(() => {
        if (selectedIds.length !== 1) return null;
        return objects.find((o) => o.id === selectedIds[0]) || null;
    }, [selectedIds, objects]);

    const selectionAnchor = useMemo(() => {
        if (!selectedObject || !containerRef.current) return null;
        const rect = containerRef.current.getBoundingClientRect();
        const obj = selectedObject;

        let worldX;
        let worldY;
        let worldW;
        let worldH;

        if (obj.type === 'line' || obj.type === 'arrow' || obj.type === 'freehand') {
            const b = getObjBBox(obj);
            worldX = b.x;
            worldY = b.y;
            worldW = Math.max(b.width, 1);
            worldH = Math.max(b.height, 1);
        } else if (obj.type === 'sticky' || obj.type === 'icon' || obj.type === 'umlClass') {
            worldX = obj.x || 0;
            worldY = obj.y || 0;
            worldW = obj.width || 150;
            worldH = obj.height || 150;
        } else {
            // Shape uses center origin via offsetX/offsetY
            worldW = obj.width || 100;
            worldH = obj.height || 100;
            worldX = (obj.x || 0) - worldW / 2;
            worldY = (obj.y || 0) - worldH / 2;
        }

        return {
            top: rect.top + worldY * stageScale + stagePos.y,
            left: rect.left + worldX * stageScale + stagePos.x,
            width: worldW * stageScale,
            height: worldH * stageScale,
        };
    }, [selectedObject, stageScale, stagePos.x, stagePos.y, stageSize.width, stageSize.height]);

    const getCursor = () => {
        if (isLaserMode) return 'crosshair';
        if (isDrawMode || isDraggingSelect) return 'crosshair';
        if (isPanMode) return 'grab';
        return 'default';
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-gray-50 dark:bg-gray-900 overflow-hidden"
            style={{
                backgroundImage: 'radial-gradient(var(--grid-dot-color, #cbd5e1) 1px, transparent 1px)',
                backgroundSize: `${visualGridSize}px ${visualGridSize}px`,
                backgroundPosition: `${stagePos.x}px ${stagePos.y}px`,
                cursor: getCursor(),
            }}
        >
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                style={{ cursor: 'inherit' }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleMouseUp}
                ref={stageRef}
                onWheel={handleWheel}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
                draggable={isPanMode}
                onDragEnd={(e) => {
                    if (e.target === stageRef.current) setStagePos({ x: e.target.x(), y: e.target.y() });
                }}
            >
                <ObjectsLayer
                    objects={objects}
                    selectedIds={selectedIds}
                    animKey={animKey}
                    isAnimating={isAnimating}
                    stageScale={stageScale}
                    selBox={selBox}
                    drawPreview={renderDrawPreview()}
                    onObjSelect={handleObjSelect}
                    onUpdate={onUpdate}
                    trRef={trRef}
                />

                <CursorsLayer
                    remoteCursors={remoteCursors}
                    stageScale={stageScale}
                    stagePos={stagePos}
                />
            </Stage>

            {selectedObject && isTextCapable(selectedObject) && selectionAnchor && (
                <TextFormatBar
                    object={selectedObject}
                    anchor={selectionAnchor}
                    onChange={(patch) => onUpdate(selectedObject.id, patch)}
                />
            )}
            {selectedObject && (selectedObject.type === 'line' || selectedObject.type === 'arrow') && selectionAnchor && (
                <ConnectorStyleBar
                    object={selectedObject}
                    anchor={selectionAnchor}
                    onChange={(patch) => onUpdate(selectedObject.id, patch)}
                />
            )}
        </div>
    );
});

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
