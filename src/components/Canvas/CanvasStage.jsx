import { useState, useEffect, useLayoutEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Line, Arrow as KonvaArrow, Rect as KonvaRect, Transformer, Group, Path, Rect as KonvaRectLabel, Text as KonvaText } from 'react-konva';
import Shape from './Shape';
import StickyNote from './StickyNote';
import Connector from './Connector';
import IconNode from './IconNode';
import { generateId } from '../../utils/helpers';

const DRAW_TOOLS = ['line', 'arrow', 'freehand'];

const CanvasStage = forwardRef(({
    objects,
    onUpdate,
    onSelect,
    onDelete,
    onAdd,
    activeTool,
    stageScale,
    stagePos,
    setStageScale,
    setStagePos,
    remoteCursors = {},
    onCursorMove,
}, ref) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawPoints, setDrawPoints] = useState([]);
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

    // Export methods via forwardRef
    useImperativeHandle(ref, () => ({
        exportImage: () => stageRef.current?.toDataURL({ pixelRatio: 2 }) || null,
    }), []);

    const isDrawMode = DRAW_TOOLS.includes(activeTool);
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

    // Keyboard: Delete + Arrow key movement
    useEffect(() => {
        const handleKeyDown = (e) => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

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
                // Read from ref to avoid stale closure on rapid key holds
                const pos = lastPositionsRef.current[id] || { x: 0, y: 0 };
                onUpdate(id, { x: pos.x + dx, y: pos.y + dy });
            });
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, onDelete, onUpdate, onSelect]);

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
        let direction = e.evt.deltaY > 0 ? 1 : -1;
        if (e.evt.ctrlKey) direction = -direction;
        const newScale = direction > 0 ? oldScale / scaleBy : oldScale * scaleBy;
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

    const handleObjSelect = (objId, e) => {
        if (activeTool === 'eraser') { onDelete(objId); return; }

        // Alt+click: cycle through overlapping objects
        if (e?.evt?.altKey) {
            const stage = stageRef.current;
            const pointerPos = stage.getPointerPosition();
            const pos = getWorldPos(pointerPos);

            // Check if this is the same click position as before
            const isSamePosClick = lastClickPosRef.current &&
                Math.abs(lastClickPosRef.current.x - pos.x) < 10 &&
                Math.abs(lastClickPosRef.current.y - pos.y) < 10;

            // Find all objects at or near this position
            const overlappingIds = objects
                .map((obj, idx) => ({ ...obj, idx }))
                .filter(obj => {
                    const bbox = getObjBBox(obj);
                    return pos.x >= bbox.x && pos.x <= bbox.x + bbox.width &&
                           pos.y >= bbox.y && pos.y <= bbox.y + bbox.height;
                })
                .map(obj => obj.id);

            if (overlappingIds.length > 1) {
                // Reset cycle index if different position
                if (!isSamePosClick) {
                    cycleIndexRef.current = 0;
                }
                // Find current selection in overlapping list
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

        // Reset cycle state on regular click
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
    };

    const handleMouseDown = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
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
        if (isDrawing) {
            setIsDrawing(false);
            if (drawPoints.length >= 4) {
                onAdd({ id: generateId(), type: activeTool, points: [...drawPoints], x: 0, y: 0, stroke: '#374151', strokeWidth: 2 });
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
        if (!isDrawing || drawPoints.length < 4) return null;
        const previewProps = { points: drawPoints, stroke: '#6366f1', strokeWidth: 2, dash: [6, 3], listening: false };
        if (activeTool === 'arrow') return <KonvaArrow {...previewProps} pointerLength={10} pointerWidth={10} fill="#6366f1" />;
        if (activeTool === 'freehand') return <Line {...previewProps} tension={0.5} lineCap="round" lineJoin="round" dash={undefined} opacity={0.6} />;
        return <Line {...previewProps} />;
    };

    const getCursor = () => {
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
                draggable={!isDrawMode && !isDraggingSelect}
                onDragEnd={(e) => {
                    if (e.target === stageRef.current) setStagePos({ x: e.target.x(), y: e.target.y() });
                }}
            >
                <Layer>
                    {objects.map((obj) => {
                        const isSelected = selectedIds.includes(obj.id);
                        if (obj.type === 'sticky') {
                            return (
                                <StickyNote
                                    key={obj.id}
                                    noteProps={obj}
                                    isSelected={isSelected}
                                    onSelect={(e) => handleObjSelect(obj.id, e)}
                                    onChange={(a) => onUpdate(obj.id, a)}
                                />
                            );
                        }
                        if (obj.type === 'line' || obj.type === 'arrow' || obj.type === 'freehand') {
                            return (
                                <Connector
                                    key={obj.id}
                                    connectorProps={obj}
                                    isSelected={isSelected}
                                    onSelect={(e) => handleObjSelect(obj.id, e)}
                                    onChange={(a) => onUpdate(obj.id, a)}
                                />
                            );
                        }
                        if (obj.type === 'icon') {
                            return (
                                <IconNode
                                    key={obj.id}
                                    iconProps={obj}
                                    isSelected={isSelected}
                                    onSelect={(e) => handleObjSelect(obj.id, e)}
                                    onChange={(a) => onUpdate(obj.id, a)}
                                />
                            );
                        }
                        return (
                            <Shape
                                key={obj.id}
                                shapeProps={obj}
                                isSelected={isSelected}
                                onSelect={(e) => handleObjSelect(obj.id, e)}
                                onChange={(a) => onUpdate(obj.id, a)}
                            />
                        );
                    })}

                    {/* Shared Transformer for all selected nodes */}
                    <Transformer
                        ref={trRef}
                        boundBoxFunc={(oldBox, newBox) =>
                            newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
                        }
                    />

                    {/* Rubber-band selection rectangle */}
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
                    {renderDrawPreview()}
                </Layer>

                {/* Remote cursors — separate non-interactive layer, no scale applied */}
                <Layer listening={false}>
                    {Object.values(remoteCursors).map(({ userId, name, color, x, y }) => {
                        // Convert world coords → screen coords
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
            </Stage>
        </div>
    );
});

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;
