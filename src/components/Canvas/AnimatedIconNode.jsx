/**
 * Animated Icon Node
 *
 * Features:
 * - Staggered entrance animation (scale + fade)
 * - Breathing pulse when isAnimating=true (±2.5% scale sine wave)
 * - Hover state (scale + shadow)
 * - Dark mode aware colors
 * - Clean label typography
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import { getIconUrl } from '../Icons/iconRegistry';

const LABEL_HEIGHT = 16;
const LABEL_GAP = 6;
const ICON_PADDING = 8;

const AnimatedIconNode = ({ iconProps, isSelected, onSelect, onChange, pulseDelay = 0, isAnimating = false }) => {
    const { id, x, y, width = 64, height = 64, iconKey, label } = iconProps;

    const [image, setImage] = useState(null);
    const [hovered, setHovered] = useState(false);
    const [animProgress, setAnimProgress] = useState(0);
    const [isDark, setIsDark] = useState(false);
    const [breathScale, setBreathScale] = useState(1);
    const frameRef = useRef(null);
    const startTimeRef = useRef(null);
    const breathFrameRef = useRef(null);
    const groupRef = useRef(null);

    // Dark mode detection
    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Continuous breathing pulse animation
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || !isAnimating) {
            setBreathScale(1);
            return;
        }

        const period = 2500; // ms per cycle
        const amplitude = 0.025; // ±2.5% scale
        const startTime = performance.now() + pulseDelay * 100;

        const animate = (time) => {
            const elapsed = time - startTime;
            if (elapsed < 0) {
                breathFrameRef.current = requestAnimationFrame(animate);
                return;
            }
            const t = (elapsed % period) / period;
            // Smooth sine wave: 1.0 → 1.025 → 1.0
            const pulse = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
            setBreathScale(1 + amplitude * pulse);
            breathFrameRef.current = requestAnimationFrame(animate);
        };

        breathFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (breathFrameRef.current) cancelAnimationFrame(breathFrameRef.current);
            setBreathScale(1);
        };
    }, [isAnimating, pulseDelay]);

    // Dark mode aware colors
    const bgFill = hovered ? (isDark ? '#334155' : '#f8fafc') : (isDark ? '#1e293b' : '#ffffff');
    const labelFill = isDark ? '#e2e8f0' : '#475569';
    const placeholderFill = isDark ? '#334155' : '#f1f5f9';
    const shadowBlurBase = isDark ? 14 : 8;
    const shadowOpacityBase = isDark ? 0.25 : 0.08;

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
    const entranceScale = hovered ? 1.05 : animProgress;
    // Combine entrance scale with breathing pulse
    const combinedScale = entranceScale * breathScale;
    const shadowBlur = hovered ? 24 : shadowBlurBase;
    const shadowOpacity = hovered ? 0.3 : shadowOpacityBase;

    return (
        <Group
            ref={groupRef}
            id={id}
            x={x}
            y={y}
            scaleX={combinedScale}
            scaleY={combinedScale}
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
            {/* Hit area */}
            <Rect
                width={width}
                height={totalHeight}
                fill="transparent"
            />

            {/* Icon background */}
            <Rect
                width={width}
                height={height}
                fill={bgFill}
                cornerRadius={12}
                shadowColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}
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
                    fill={placeholderFill}
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
                fill={labelFill}
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
