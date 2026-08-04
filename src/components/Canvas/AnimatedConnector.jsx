import { Group, Line, Circle } from 'react-konva';
import { useRef, useEffect, useState, useCallback } from 'react';
import Konva from 'konva';
import {
    getDashForLineStyle,
    getMarkerSize,
    resolveMarkers,
    insetShaftPoints,
    markerInset,
    buildMarkerGeometry,
    getEndpointDirections,
} from '../../utils/connectorMarkers';
import EndpointHandles from './EndpointHandles';

/**
 * AnimatedConnector: Arrow/line with optional UML markers and flowing particles.
 */

const PARTICLE_COUNT = 3;
const PARTICLE_RADIUS = 2.5;
const PARTICLE_SPEED = 0.012;
const PARTICLE_COLOR_LIGHT = '#0284c7';
const PARTICLE_COLOR_DARK = '#22d3ee';

const MarkerShape = ({ geom, stroke, strokeWidth }) => {
    if (!geom) return null;
    if (geom.kind === 'open') {
        return (
            <Line
                points={geom.points}
                stroke={stroke}
                strokeWidth={strokeWidth}
                lineCap="round"
                lineJoin="round"
                listening={false}
            />
        );
    }
    return (
        <Line
            points={geom.points}
            closed
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={geom.fill ? stroke : undefined}
            fillEnabled={Boolean(geom.fill)}
            lineJoin="round"
            listening={false}
        />
    );
};

const AnimatedConnector = ({ connectorProps, isSelected, onSelect, onChange, isAnimating = false }) => {
    const { id, points: rawPoints, stroke, strokeWidth, x = 0, y = 0 } = connectorProps;
    const points = rawPoints || [0, 0, 100, 100];
    const animRef = useRef(null);
    const particlesRef = useRef([]);
    const [tick, setTick] = useState(0);
    const [isDark, setIsDark] = useState(false);
    const groupRef = useRef(null);
    const isDraggingRef = useRef(false);

    useEffect(() => {}, [isSelected, tick]);

    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

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
            if (!isDraggingRef.current) {
                setTick(t => t + 1);
            }
        });
        animation.start();
        animRef.current = animation;

        return () => animation.stop();
    }, [id, isAnimating]);

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

    const { startMarker, endMarker, lineStyle } = resolveMarkers(connectorProps);
    const size = getMarkerSize(actualWidth);
    const startIn = markerInset(startMarker, size);
    const endIn = markerInset(endMarker, size);
    const shaftPoints = insetShaftPoints(points, startIn, endIn);
    const dash = getDashForLineStyle(lineStyle);
    const { startTip, endTip } = getEndpointDirections(points);
    const startGeom = buildMarkerGeometry(startMarker, startTip.x, startTip.y, startTip.ux, startTip.uy, size);
    const endGeom = buildMarkerGeometry(endMarker, endTip.x, endTip.y, endTip.ux, endTip.uy, size);

    const handleDragStart = (e) => {
        if (e.target !== groupRef.current) {
            return;
        }
        isDraggingRef.current = true;
    };

    const handleDragEnd = (e) => {
        if (e.target !== groupRef.current) return;
        isDraggingRef.current = false;
        onChange({
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    return (
        <Group
            id={id}
            x={x}
            y={y}
            ref={groupRef}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={onSelect}
            onTap={onSelect}
        >
            <Line
                points={points}
                stroke="transparent"
                strokeWidth={28}
                perfectDrawEnabled={false}
            />
            <Line
                points={shaftPoints}
                stroke={actualStroke}
                strokeWidth={actualWidth}
                dash={dash || []}
                dashEnabled={Boolean(dash)}
                lineCap="round"
                lineJoin="round"
                hitStrokeWidth={20}
                listening={false}
            />
            <MarkerShape geom={startGeom} stroke={actualStroke} strokeWidth={Math.max(1.5, actualWidth)} />
            <MarkerShape geom={endGeom} stroke={actualStroke} strokeWidth={Math.max(1.5, actualWidth)} />
            {renderParticles()}
            {isSelected && (
                <EndpointHandles points={points} onChange={onChange} />
            )}
        </Group>
    );
};

export default AnimatedConnector;
