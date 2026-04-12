import { Group, Line, Arrow as KonvaArrow, Circle, Path } from 'react-konva';
import { useRef, useEffect, useState, useCallback } from 'react';
import Konva from 'konva';

/**
 * AnimatedConnector: Arrow with flowing data particles along the edge path.
 *
 * Features:
 * - Particles travel along the exact edge path (including bends)
 * - Dark mode aware particle color
 * - Draggable — moves independently from nodes
 * - Click-to-select with widened hit area
 * - Smooth, continuous animation
 */

const PARTICLE_COUNT = 3;
const PARTICLE_RADIUS = 2.5;
const PARTICLE_SPEED = 0.012; // 3x faster: one full loop in ~1.3 seconds
const PARTICLE_COLOR_LIGHT = '#38bdf8';  // Sky blue
const PARTICLE_COLOR_DARK = '#22d3ee';   // Cyan

const AnimatedConnector = ({ connectorProps, isSelected, onSelect, onChange, isAnimating = false }) => {
    const { id, points, stroke, strokeWidth, x = 0, y = 0 } = connectorProps;
    const animRef = useRef(null);
    const particlesRef = useRef([]);
    const [tick, setTick] = useState(0);
    const [isDark, setIsDark] = useState(false);
    const groupRef = useRef(null);

    // Store original position at drag start
    const dragOriginRef = useRef({ x: 0, y: 0 });

    // Dark mode detection
    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Get point along the polyline at a given progress (0-1)
    const getPointAtProgress = useCallback((progress) => {
        if (!points || points.length < 4) return { x: 0, y: 0 };

        let totalLength = 0;
        const segments = [];
        for (let i = 0; i < points.length - 2; i += 2) {
            const dx = points[i + 2] - points[i];
            const dy = points[i + 3] - points[i + 1];
            const len = Math.sqrt(dx * dx + dy * dy);
            segments.push({
                len,
                fromX: points[i], fromY: points[i + 1],
                toX: points[i + 2], toY: points[i + 3],
            });
            totalLength += len;
        }

        if (totalLength === 0) return { x: points[0] || 0, y: points[1] || 0 };

        const targetDist = progress * totalLength;
        let accumulated = 0;
        for (const seg of segments) {
            if (accumulated + seg.len >= targetDist) {
                const t = (targetDist - accumulated) / seg.len;
                return {
                    x: seg.fromX + (seg.toX - seg.fromX) * t,
                    y: seg.fromY + (seg.toY - seg.fromY) * t,
                };
            }
            accumulated += seg.len;
        }

        return { x: points[points.length - 2], y: points[points.length - 1] };
    }, [points]);

    // Animation loop - only runs when isAnimating is true
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || !isAnimating) {
            animRef.current?.stop();
            return;
        }

        particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
            progress: i / PARTICLE_COUNT,
        }));

        const animation = new Konva.Animation(() => {
            particlesRef.current.forEach(p => {
                p.progress += PARTICLE_SPEED;
                if (p.progress > 1) p.progress -= 1;
            });
            setTick(t => t + 1);
        });
        animation.start();
        animRef.current = animation;

        return () => animation.stop();
    }, [id, isAnimating]);

    // Render particles along the path
    const renderParticles = () => {
        if (!isAnimating) return null;
        const color = isDark ? PARTICLE_COLOR_DARK : PARTICLE_COLOR_LIGHT;
        return particlesRef.current.map((particle, i) => {
            const pos = getPointAtProgress(particle.progress);
            return (
                <Circle
                    key={`${id}-p-${i}`}
                    x={pos.x}
                    y={pos.y}
                    radius={PARTICLE_RADIUS}
                    fill={color}
                    shadowColor={color}
                    shadowBlur={10}
                    shadowOpacity={0.6}
                    opacity={0.85}
                    listening={false}
                />
            );
        });
    };

    const arrowColor = isDark ? '#94a3b8' : '#475569';
    const actualStroke = stroke || arrowColor;
    const actualWidth = strokeWidth || 2.5;

    const handleDragStart = () => {
        dragOriginRef.current = { x: x || 0, y: y || 0 };
    };

    const handleDragMove = (e) => {
        const node = e.target;
        const dx = node.x();
        const dy = node.y();
        // Move the group visually during drag so everything follows the cursor
        if (groupRef.current) {
            groupRef.current.position({ x: dragOriginRef.current.x + dx, y: dragOriginRef.current.y + dy });
        }
    };

    const handleDragEnd = (e) => {
        const node = e.target;
        const dx = node.x();
        const dy = node.y();

        // Translate all points by the drag delta
        const newPoints = points.map((v, i) => v + (i % 2 === 0 ? dx : dy));

        onChange({
            x: 0,
            y: 0,
            points: newPoints,
        });

        // Reset the draggable element back to origin (points are now absolute)
        node.position({ x: 0, y: 0 });
    };

    return (
        <Group id={id} x={x} y={y} ref={groupRef}>
            {/* Invisible wide hit area — this is the draggable surface */}
            <Line
                x={0} y={0}
                points={points || [0, 0, 100, 100]}
                stroke="transparent"
                strokeWidth={28}
                draggable
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onClick={onSelect}
                onTap={onSelect}
                perfectDrawEnabled={false}
            />
            {/* Visible arrow — NOT draggable, follows points (updated on drag end) */}
            <KonvaArrow
                x={0}
                y={0}
                points={points || [0, 0, 100, 100]}
                stroke={actualStroke}
                strokeWidth={actualWidth}
                lineCap="round"
                lineJoin="round"
                pointerLength={12}
                pointerWidth={10}
                fill={actualStroke}
                onClick={onSelect}
                onTap={onSelect}
                hitStrokeWidth={20}
                listening={false}
            />
            {/* Flowing particles */}
            {renderParticles()}
        </Group>
    );
};

export default AnimatedConnector;
