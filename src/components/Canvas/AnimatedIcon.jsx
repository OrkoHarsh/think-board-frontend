import { useState, useEffect, useRef } from 'react';
import { Group, Circle, Rect, Text, Image as KonvaImage } from 'react-konva';
import { getIconUrl } from '../Icons/iconRegistry';

const LABEL_GAP = 6;
const LABEL_HEIGHT = 18;

const AnimatedIcon = ({ iconProps, isSelected, onSelect, onChange, pulseDelay = 0 }) => {
    const { id, x = 0, y = 0, width = 100, height = 100, iconKey, label = '' } = iconProps;
    const [image, setImage] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [pulseRadius, setPulseRadius] = useState(0);
    const [pulseOpacity, setPulseOpacity] = useState(0);
    const [isDark, setIsDark] = useState(false);
    const frameRef = useRef(null);
    const startTimeRef = useRef(0);

    console.log(`[AnimatedIcon ${id}] Rendering at (${x.toFixed(0)}, ${y.toFixed(0)}) size=${width}x${height} key=${iconKey} label=${label}`);

    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkDark();
        const obs = new MutationObserver(checkDark);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!iconKey) return;
        const url = getIconUrl(iconKey);
        console.log(`[AnimatedIcon ${id}] Icon URL:`, url);
        if (!url) { setImageError(true); return; }
        let cancelled = false;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => { if (!cancelled) setImage(img); };
        img.onerror = () => { if (!cancelled) { setImageError(true); setImage(null); } };
        return () => { cancelled = true; };
    }, [iconKey, id]);

    useEffect(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) return;
        startTimeRef.current = performance.now();
        const r = Math.max(width, height) / 2 + 2;
        const maxR = r + 2;
        const amp = maxR - r;
        const period = 6000;
        const animate = (time) => {
            const elapsed = time - startTimeRef.current;
            if (elapsed < pulseDelay * 1000) { frameRef.current = requestAnimationFrame(animate); return; }
            const p = Math.sin(((elapsed % period) / period) * Math.PI);
            setPulseRadius(r + amp * p);
            setPulseOpacity(0.08 * p);
            frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [width, height, pulseDelay]);

    const handleDragEnd = (e) => onChange({ x: e.target.x(), y: e.target.y() });
    const handleTransformEnd = (e) => {
        const n = e.target;
        const sx = n.scaleX(), sy = n.scaleY();
        n.scaleX(1); n.scaleY(1);
        onChange({ x: n.x(), y: n.y(), width: Math.max(24, width * sx), height: Math.max(24, height * sy) });
    };

    const radius = Math.max(width, height) / 2;
    const cx = radius;
    const cy = radius;
    const iconDrawSize = radius * 1.4;
    const totalW = radius * 2;
    const totalH = radius * 2 + LABEL_GAP + LABEL_HEIGHT + 10;

    const bgFill = isDark ? '#334155' : '#ffffff';
    const bgStroke = isDark ? '#475569' : '#e5e7eb';
    const textColor = isDark ? '#e2e8f0' : '#475563';
    const pulseColor = isDark ? '#a5b4fc' : '#818cf8';

    return (
        <Group id={id} x={x} y={y} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Hit area */}
            <Rect width={totalW} height={totalH} fill="transparent" />

            {/* Pulse glow */}
            {pulseRadius > 0 && <Circle x={cx} y={cy} radius={pulseRadius} fill={pulseColor} opacity={pulseOpacity} listening={false} />}

            {/* Background circle */}
            <Circle x={cx} y={cy} radius={radius} fill={bgFill} stroke={bgStroke} strokeWidth={1} listening={false} />

            {/* Icon or fallback */}
            {image ? (
                <KonvaImage image={image} x={cx - iconDrawSize / 2} y={cy - iconDrawSize / 2} width={iconDrawSize} height={iconDrawSize}
                    shadowColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} shadowBlur={4} shadowOffsetX={0} shadowOffsetY={1} />
            ) : imageError ? (
                <Text x={cx - 20} y={cy - 10} text={iconKey || '?'} fontSize={12} fill="#ef4444" align="center" listening={false} />
            ) : (
                <Rect x={cx - iconDrawSize / 2} y={cy - iconDrawSize / 2} width={iconDrawSize} height={iconDrawSize} fill="#f1f5f9" cornerRadius={8} stroke="#cbd5e1" strokeWidth={1} />
            )}

            {/* Label */}
            <Text text={label} y={cy + radius + LABEL_GAP} width={totalW} fontSize={11} fontFamily="Inter, system-ui, sans-serif" fill={textColor} align="center" ellipsis wrap="none" listening={false} />
        </Group>
    );
};

export default AnimatedIcon;
