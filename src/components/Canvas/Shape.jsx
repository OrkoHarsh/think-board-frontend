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

    const handleDragEnd = (e) => {
        onChange({
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    const handleTransformEnd = () => {
        const node = groupRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, shapeProps.width * scaleX),
            height: Math.max(5, shapeProps.height * scaleY),
        });
    };

    const handleDblClick = () => {
        const stage = groupRef.current.getStage();
        const stageBox = stage.container().getBoundingClientRect();

        // Use getAbsoluteTransform for robust pixel-perfect positioning
        const transform = groupRef.current.getAbsoluteTransform().copy();
        const topLeft = transform.point({ x: 0, y: 0 });
        const bottomRight = transform.point({ x: shapeProps.width, y: shapeProps.height });

        const left = stageBox.left + topLeft.x;
        const top = stageBox.top + topLeft.y;
        const areaWidth = bottomRight.x - topLeft.x;
        const areaHeight = bottomRight.y - topLeft.y;

        const isRound = shapeProps.type === 'circle' || shapeProps.type === 'ellipse';

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = shapeProps.text || '';
        Object.assign(textarea.style, {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${areaWidth}px`,
            height: `${areaHeight}px`,
            fontSize: `${14 * (stage.scaleX() || 1)}px`,
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
            textAlign: 'center',
            fontFamily: 'sans-serif',
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
    const textColor = getTextColor(fill);
    const textSize = isTextType ? 20 : 14;
    const displayText = text || (text === '' ? '' : 'Double-click to edit');

    return (
        <>
            <Group
                id={shapeProps.id}
                ref={groupRef}
                x={x}
                y={y}
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
            >
                {renderShape()}
                <Text
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    text={displayText}
                    align="center"
                    verticalAlign="middle"
                    fontSize={textSize}
                    fontFamily="sans-serif"
                    fill={textColor}
                    listening={false}
                    wrap="word"
                />
            </Group>
        </>
    );
};

export default Shape;
