/**
 * Animated Icon Node
 *
 * Features:
 * - Staggered entrance animation (scale + fade)
 * - Subtle pulse glow ring (per-layer color)
 * - Hover state (scale + shadow)
 * - Gradient border per architectural layer
 * - Clean label typography
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Group, Image as KonvaImage, Rect, Text, Circle } from 'react-konva';
import { getIconUrl } from '../Icons/iconRegistry';

const LABEL_HEIGHT = 16;
const LABEL_GAP = 6;
const ICON_PADDING = 8;

// Layer-based gradient colors
const LAYER_GRADIENTS = {
    0: ['#60a5fa', '#3b82f6'],  // Entry: Blue
    1: ['#a78bfa', '#8b5cf6'],  // Edge: Purple
    2: ['#34d399', '#10b981'],  // Compute: Green
    3: ['#f87171', '#ef4444'],  // Storage: Red
    4: ['#fbbf24', '#f59e0b'],  // Observability: Amber
};

const LAYER_GLOW = {
    0: 'rgba(96,165,250,0.15)',
    1: 'rgba(167,139,250,0.15)',
    2: 'rgba(52,211,153,0.15)',
    3: 'rgba(248,113,113,0.15)',
    4: 'rgba(251,191,36,0.15)',
};

// Detect layer from icon keyword
function detectLayer(iconKey, label) {
    const lower = (label || '').toLowerCase();
    const icon = (iconKey || '').toLowerCase();

    if (lower.includes('client') || lower.includes('user') || lower.includes('mobile') || lower.includes('browser')) return 0;
    if (lower.includes('gateway') || lower.includes('load') || lower.includes('proxy') || lower.includes('nginx') || icon.includes('gate')) return 1;
    if (lower.includes('service') || lower.includes('server') || lower.includes('auth') || lower.includes('api') || lower.includes('generator') || lower.includes('redirect') || lower.includes('dashboard') || lower.includes('admin') || lower.includes('management')) return 2;
    if (lower.includes('database') || lower.includes('postgres') || lower.includes('mysql') || lower.includes('mongo') || lower.includes('cache') || lower.includes('redis') || lower.includes('queue') || lower.includes('kafka') || lower.includes('storage') || lower.includes('hash')) return 3;
    if (lower.includes('monitor') || lower.includes('analytics') || lower.includes('logging') || lower.includes('grafana') || lower.includes('prometheus') || lower.includes('metric') || lower.includes('alert')) return 4;
    return 2; // Default: compute layer
}

const AnimatedIconNode = ({ iconProps, isSelected, onSelect, onChange, pulseDelay = 0 }) => {
    const { id, x, y, width = 64, height = 64, iconKey, label } = iconProps;

    const [image, setImage] = useState(null);
    const [hovered, setHovered] = useState(false);
    const [animProgress, setAnimProgress] = useState(0);
    const [glowRadius, setGlowRadius] = useState(0);
    const frameRef = useRef(null);
    const startTimeRef = useRef(null);
    const glowFrameRef = useRef(null);
    const groupRef = useRef(null);

    // Detect layer for color coding
    const layer = detectLayer(iconKey, label);
    const gradient = LAYER_GRADIENTS[layer] || LAYER_GRADIENTS[2];
    const glowColor = LAYER_GLOW[layer] || LAYER_GLOW[2];

    // Load icon image
    useEffect(() => {
        const url = getIconUrl(iconKey);
        if (!url) return;
        let cancelled = false;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => { if (!cancelled) setImage(img); };
        img.onerror = () => { if (!cancelled) setImage(null); };
        return () => { cancelled = true; };
    }, [iconKey]);

    // Entrance animation
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            setAnimProgress(1);
            return;
        }

        startTimeRef.current = performance.now();
        const duration = 400; // ms
        const delay = pulseDelay * 1000;

        const animate = (time) => {
            const elapsed = time - startTimeRef.current;
            if (elapsed < delay) {
                frameRef.current = requestAnimationFrame(animate);
                return;
            }
            const t = Math.min((elapsed - delay) / duration, 1);
            // Ease out back
            const c1 = 1.70158;
            const c3 = c1 + 1;
            const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            setAnimProgress(Math.min(eased, 1));
            if (t < 1) frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [pulseDelay]);

    // Continuous subtle glow pulse
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const baseRadius = Math.max(width, height) / 2 + 4;
        const amplitude = 6;
        const period = 4000;

        const animate = (time) => {
            const t = (time % period) / period;
            const pulse = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
            setGlowRadius(baseRadius + amplitude * pulse);
            glowFrameRef.current = requestAnimationFrame(animate);
        };

        glowFrameRef.current = requestAnimationFrame(animate);
        return () => { if (glowFrameRef.current) cancelAnimationFrame(glowFrameRef.current); };
    }, [width, height]);

    const handleDragEnd = useCallback((e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
    }, [onChange]);

    const handleTransformEnd = useCallback((e) => {
        const node = e.target;
        const sx = node.scaleX(), sy = node.scaleY();
        node.scaleX(1); node.scaleY(1);
        onChange({
            x: node.x(), y: node.y(),
            width: Math.max(40, width * sx),
            height: Math.max(40, height * sy),
        });
    }, [width, height, onChange]);

    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => setHovered(false), []);

    const totalHeight = height + LABEL_GAP + LABEL_HEIGHT;
    const scale = hovered ? 1.05 : animProgress;
    const shadowBlur = hovered ? 20 : 8;
    const shadowOpacity = hovered ? 0.2 : 0.08;

    return (
        <Group
            ref={groupRef}
            id={id}
            x={x}
            y={y}
            scaleX={scale}
            scaleY={scale}
            offsetX={width / 2}
            offsetY={totalHeight / 2}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Glow ring */}
            <Circle
                x={width / 2}
                y={height / 2}
                radius={glowRadius}
                fill={glowColor}
                listening={false}
            />

            {/* Hit area */}
            <Rect
                width={width}
                height={totalHeight}
                fill="transparent"
            />

            {/* Icon background with gradient border effect */}
            <Rect
                width={width}
                height={height}
                fill={hovered ? '#f8fafc' : '#ffffff'}
                cornerRadius={12}
                stroke={gradient[1]}
                strokeWidth={hovered ? 2.5 : 1.5}
                shadowColor={gradient[0]}
                shadowBlur={shadowBlur}
                shadowOpacity={shadowOpacity}
                shadowOffsetX={0}
                shadowOffsetY={2}
            />

            {/* Icon image */}
            {image ? (
                <KonvaImage
                    image={image}
                    x={ICON_PADDING}
                    y={ICON_PADDING}
                    width={width - ICON_PADDING * 2}
                    height={height - ICON_PADDING * 2}
                />
            ) : (
                <Rect
                    x={ICON_PADDING}
                    y={ICON_PADDING}
                    width={width - ICON_PADDING * 2}
                    height={height - ICON_PADDING * 2}
                    fill="#f1f5f9"
                    cornerRadius={8}
                />
            )}

            {/* Label */}
            <Text
                text={label || ''}
                x={0}
                y={height + LABEL_GAP}
                width={width}
                height={LABEL_HEIGHT}
                fontSize={10}
                fontFamily="'Inter', system-ui, -apple-system, sans-serif"
                fontStyle="500"
                fill="#475569"
                align="center"
                verticalAlign="middle"
                ellipsis
                wrap="none"
                listening={false}
            />
        </Group>
    );
};

export default AnimatedIconNode;
