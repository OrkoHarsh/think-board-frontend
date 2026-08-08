import { Rect, Circle, Ellipse, Line as KonvaLine, Text, Group } from 'react-konva';
import { useRef, useEffect, useState } from 'react';

// Calculate text color based on fill luminance for contrast
const getTextColor = (fill) => {
    if (!fill || fill === 'transparent') return '#1f2937';
    const hex = fill.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1f2937' : '#ffffff';
};

const Shape = ({ shapeProps, isSelected, onSelect, onChange, isAnimating = false, pulseDelay = 0 }) => {
    const groupRef = useRef();
    const [breathScale, setBreathScale] = useState(1);
    const [entranceScale, setEntranceScale] = useState(0);
    const frameRef = useRef(null);
    const startTimeRef = useRef(null);

    // Entrance animation (scale + fade)
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) { setEntranceScale(1); return; }

        startTimeRef.current = performance.now();
        const duration = 400;
        const delay = pulseDelay * 100;

        const animate = (time) => {
            const elapsed = time - startTimeRef.current;
            if (elapsed < delay) { frameRef.current = requestAnimationFrame(animate); return; }
            const t = Math.min((elapsed - delay) / duration, 1);
            const c1 = 1.70158, c3 = c1 + 1;
            const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            setEntranceScale(Math.min(eased, 1));
            if (t < 1) frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [pulseDelay]);

    // Breathing pulse animation
    useEffect(() => {
        if (!isAnimating) {
            setBreathScale(1);
            return;
        }

        const period = 2500;
        const amplitude = 0.025;
        const startTime = performance.now();

        const animate = (time) => {
            const elapsed = time - startTime;
            const t = (elapsed % period) / period;
            const pulse = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
            setBreathScale(1 + amplitude * pulse);
            requestAnimationFrame(animate);
        };

        const frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [isAnimating]);

    // x/y are stored as the top-left corner (matching sticky notes, UML nodes, thumbnails and the
    // mermaid mapper). The group is placed at the centre so scaling animates outwards, so every
    // read/write of a position has to convert between the two.
    const handleDragEnd = (e) => {
        onChange({
            x: e.target.x() - shapeProps.width / 2,
            y: e.target.y() - shapeProps.height / 2,
        });
    };

    const handleTransformEnd = () => {
        const node = groupRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        const nextWidth = Math.max(5, shapeProps.width * scaleX);
        const nextHeight = Math.max(5, shapeProps.height * scaleY);

        onChange({
            x: node.x() - nextWidth / 2,
            y: node.y() - nextHeight / 2,
            width: nextWidth,
            height: nextHeight,
        });
    };

    const handleDblClick = () => {
        const stage = groupRef.current.getStage();
        const stageBox = stage.container().getBoundingClientRect();
        const scale = stage.scaleX() || 1;

        // Use getAbsoluteTransform for robust pixel-perfect positioning
        const transform = groupRef.current.getAbsoluteTransform().copy();
        const topLeft = transform.point({ x: 0, y: 0 });
        const bottomRight = transform.point({ x: shapeProps.width, y: shapeProps.height });

        const left = stageBox.left + topLeft.x;
        const top = stageBox.top + topLeft.y;
        const areaWidth = bottomRight.x - topLeft.x;
        const areaHeight = bottomRight.y - topLeft.y;

        const isRound = shapeProps.type === 'circle' || shapeProps.type === 'ellipse';
        const isTextType = shapeProps.type === 'text';
        const fontSize = (shapeProps.fontSize || (isTextType ? 20 : 14)) * scale;
        const fontFamily = shapeProps.fontFamily || 'Inter, system-ui, sans-serif';
        const fontStyle = shapeProps.fontStyle || 'normal';
        const align = shapeProps.align || 'center';
        const textDecoration = shapeProps.textDecoration || '';

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = shapeProps.text || '';
        Object.assign(textarea.style, {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${areaWidth}px`,
            height: `${areaHeight}px`,
            fontSize: `${fontSize}px`,
            border: '2px solid #6366f1',
            borderRadius: isRound ? '50%' : '4px',
            padding: '4px',
            margin: '0',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.9)',
            outline: 'none',
            resize: 'none',
            color: '#1f2937',
            zIndex: '1000',
            textAlign: align,
            fontFamily,
            fontWeight: fontStyle.includes('bold') ? 'bold' : 'normal',
            fontStyle: fontStyle.includes('italic') ? 'italic' : 'normal',
            textDecoration: textDecoration || 'none',
            lineHeight: '1.3',
            boxSizing: 'border-box',
        });
        textarea.focus();
        textarea.select();

        let escaped = false;
        const done = () => {
            if (escaped) return;
            const newText = textarea.value;
            if (document.body.contains(textarea)) {
                document.body.removeChild(textarea);
            }
            onChange({ text: newText });
        };

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                escaped = true;
                if (document.body.contains(textarea)) document.body.removeChild(textarea);
            }
        });
        textarea.addEventListener('blur', done);
    };

    const { width, height, type, text, x, y, fill } = shapeProps;

    const renderShape = () => {
        switch (type) {
            case 'rect':
                return <Rect width={width} height={height} fill={fill} cornerRadius={4} />;
            case 'circle':
                return <Circle x={width / 2} y={height / 2} radius={Math.min(width, height) / 2} fill={fill} />;
            case 'triangle':
                return (
                    <KonvaLine
                        points={[width / 2, 0, width, height, 0, height]}
                        fill={fill}
                        closed
                        stroke={fill}
                        strokeWidth={1}
                    />
                );
            case 'diamond':
                return (
                    <KonvaLine
                        points={[width / 2, 0, width, height / 2, width / 2, height, 0, height / 2]}
                        fill={fill}
                        closed
                        stroke={fill}
                        strokeWidth={1}
                    />
                );
            case 'ellipse':
                return <Ellipse x={width / 2} y={height / 2} radiusX={width / 2} radiusY={height / 2} fill={fill} />;
            case 'text':
                // Invisible hit rect so text objects are selectable/draggable
                return <Rect width={width} height={height} fill="transparent" stroke="#D1D5DB" strokeWidth={1} dash={[4, 3]} />;
            default:
                return <Rect width={width} height={height} fill={fill} cornerRadius={4} />;
        }
    };

    const isTextType = type === 'text';
    const textColor = isTextType ? (fill && fill !== 'transparent' ? fill : '#1f2937') : getTextColor(fill);
    const textSize = shapeProps.fontSize || (isTextType ? 20 : 14);
    const fontFamily = shapeProps.fontFamily || 'Inter, system-ui, sans-serif';
    const fontStyle = shapeProps.fontStyle || 'normal';
    const textDecoration = shapeProps.textDecoration || '';
    const align = shapeProps.align || 'center';
    const isPlaceholder = text == null || text === undefined;
    const displayText = isPlaceholder ? 'Edit' : text;

    // Keep label inside non-rectangular shapes (triangle/diamond taper inward)
    const getTextBounds = () => {
        switch (type) {
            case 'triangle':
                return {
                    x: width * 0.2,
                    y: height * 0.42,
                    w: width * 0.6,
                    h: height * 0.48,
                };
            case 'diamond':
                return {
                    x: width * 0.22,
                    y: height * 0.28,
                    w: width * 0.56,
                    h: height * 0.44,
                };
            case 'circle':
            case 'ellipse':
                return {
                    x: width * 0.18,
                    y: height * 0.28,
                    w: width * 0.64,
                    h: height * 0.44,
                };
            default:
                return { x: 8, y: 6, w: Math.max(8, width - 16), h: Math.max(8, height - 12) };
        }
    };
    const tb = getTextBounds();
    const fitFontSize = isPlaceholder
        ? Math.min(textSize, Math.max(10, Math.floor(Math.min(tb.w, tb.h) / 3.2)))
        : textSize;

    return (
        <>
            <Group
                id={shapeProps.id}
                ref={groupRef}
                x={x + width / 2}
                y={y + height / 2}
                scaleX={entranceScale * breathScale}
                scaleY={entranceScale * breathScale}
                offsetX={width / 2}
                offsetY={height / 2}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDblClick={handleDblClick}
                onDblTap={handleDblClick}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
                clipFunc={(ctx) => {
                    // Clip label to shape silhouette so overflow never paints outside
                    if (type === 'circle' || type === 'ellipse') {
                        ctx.beginPath();
                        ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
                        ctx.closePath();
                    } else if (type === 'triangle') {
                        ctx.beginPath();
                        ctx.moveTo(width / 2, 0);
                        ctx.lineTo(width, height);
                        ctx.lineTo(0, height);
                        ctx.closePath();
                    } else if (type === 'diamond') {
                        ctx.beginPath();
                        ctx.moveTo(width / 2, 0);
                        ctx.lineTo(width, height / 2);
                        ctx.lineTo(width / 2, height);
                        ctx.lineTo(0, height / 2);
                        ctx.closePath();
                    } else {
                        ctx.beginPath();
                        ctx.rect(0, 0, width, height);
                        ctx.closePath();
                    }
                }}
            >
                {renderShape()}
                <Text
                    key={`t-${fontFamily}-${fitFontSize}-${align}-${fontStyle}-${textDecoration}-${displayText}`}
                    x={tb.x}
                    y={tb.y}
                    width={tb.w}
                    height={tb.h}
                    text={displayText}
                    align={align}
                    verticalAlign="middle"
                    fontSize={fitFontSize}
                    fontFamily={fontFamily}
                    fontStyle={fontStyle}
                    textDecoration={textDecoration}
                    fill={isPlaceholder ? (textColor === '#ffffff' ? 'rgba(255,255,255,0.7)' : 'rgba(31,41,55,0.55)') : textColor}
                    listening={false}
                    wrap="word"
                    ellipsis
                />
            </Group>
        </>
    );
};

export default Shape;
