import { useState, useEffect, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';

/**
 * AnimatedRect: Rectangle shape with breathing pulse animation.
 * - Breathing pulse when isAnimating=true (±2.5% scale sine wave)
 * - Dark mode aware colors
 * - Clean, no border/glow
 */

const AnimatedRect = ({ shapeProps, isSelected, onSelect, onChange, pulseDelay = 0, isAnimating = false }) => {
    const { id, x, y, width = 160, height = 80, fill, stroke, strokeWidth, text, label } = shapeProps;
    const [isDark, setIsDark] = useState(false);
    const [breathScale, setBreathScale] = useState(1);
    const breathFrameRef = useRef(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Breathing pulse animation
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || !isAnimating) {
            setBreathScale(1);
            return;
        }

        const period = 2500;
        const amplitude = 0.025;
        const startTime = performance.now() + pulseDelay * 100;

        const animate = (time) => {
            const elapsed = time - startTime;
            if (elapsed < 0) { breathFrameRef.current = requestAnimationFrame(animate); return; }
            const t = (elapsed % period) / period;
            const pulse = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
            setBreathScale(1 + amplitude * pulse);
            breathFrameRef.current = requestAnimationFrame(animate);
        };

        breathFrameRef.current = requestAnimationFrame(animate);
        return () => { if (breathFrameRef.current) cancelAnimationFrame(breathFrameRef.current); setBreathScale(1); };
    }, [isAnimating, pulseDelay]);

    const handleDragEnd = (e) => onChange({ x: e.target.x(), y: e.target.y() });
    const handleTransformEnd = (e) => {
        const node = e.target;
        const sx = node.scaleX(), sy = node.scaleY();
        node.scaleX(1); node.scaleY(1);
        onChange({ x: node.x(), y: node.y(), width: Math.max(24, width * sx), height: Math.max(24, height * sy) });
    };

    const centerX = width / 2;
    const centerY = height / 2;
    const displayText = text || label || '';
    const fillColor = fill || (isDark ? '#1e293b' : '#ffffff');
    const textColor = isDark ? '#cbd5e1' : '#334155';

    return (
        <Group
            id={id}
            x={x}
            y={y}
            scaleX={breathScale}
            scaleY={breathScale}
            offsetX={centerX}
            offsetY={centerY}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
        >
            <Rect width={width} height={height} fill="transparent" />
            <Rect
                width={width}
                height={height}
                fill={fillColor}
                cornerRadius={10}
                shadowColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}
                shadowBlur={8}
                shadowOffsetX={0}
                shadowOffsetY={2}
            />
            <Text
                x={0} y={0} width={width} height={height}
                text={displayText}
                align="center"
                verticalAlign="middle"
                fontSize={13}
                fontFamily="Inter, system-ui, -apple-system, sans-serif"
                fill={textColor}
                listening={false}
            />
        </Group>
    );
};

export default AnimatedRect;
