import { useState, useEffect, useRef } from 'react';
import { Group, Circle, Rect, Text } from 'react-konva';

/**
 * AnimatedRect: Rectangle shape with pulsing glow ring.
 * - Exact Excalidraw bounding box dimensions
 * - Dark mode: slate background, bright text
 * - Pulse glow: subtle, staggered
 */

const AnimatedRect = ({ shapeProps, isSelected, onSelect, onChange, pulseDelay = 0 }) => {
    const { id, x, y, width = 160, height = 80, fill, stroke, strokeWidth, text, label } = shapeProps;
    const [pulseRadius, setPulseRadius] = useState(0);
    const [pulseOpacity, setPulseOpacity] = useState(0);
    const [isDark, setIsDark] = useState(false);
    const frameRef = useRef(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;
        startTimeRef.current = performance.now();
        const baseRadius = Math.max(width, height) / 2 + 8;
        const maxRadius = baseRadius + 4;
        const amplitude = maxRadius - baseRadius;
        const period = 7000;
        const animate = (time) => {
            const elapsed = time - startTimeRef.current;
            if (elapsed < pulseDelay * 1000) { frameRef.current = requestAnimationFrame(animate); return; }
            const pulse = Math.sin(((elapsed % period) / period) * Math.PI);
            setPulseRadius(baseRadius + amplitude * pulse);
            setPulseOpacity(0.08 * pulse);
            frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [width, height, pulseDelay]);

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
    const strokeColor = stroke || (isDark ? '#475569' : '#64748b');
    const textColor = isDark ? '#cbd5e1' : '#334155';
    const pulseColor = isDark ? '#818cf8' : '#6366f1';

    return (
        <Group id={id} x={x} y={y} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            <Rect width={width} height={height} fill="transparent" />
            {pulseRadius > 0 && (
                <Circle x={centerX} y={centerY} radius={pulseRadius} fill={pulseColor} opacity={pulseOpacity} listening={false} />
            )}
            <Rect width={width} height={height} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth || 2} cornerRadius={10}
                shadowColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'} shadowBlur={8} shadowOffsetX={0} shadowOffsetY={2} />
            <Text x={0} y={0} width={width} height={height} text={displayText} align="center" verticalAlign="middle"
                fontSize={13} fontFamily="Inter, system-ui, -apple-system, sans-serif" fill={textColor} listening={false} />
        </Group>
    );
};

export default AnimatedRect;
