import { Group, Line } from 'react-konva';
import { useRef, useEffect } from 'react';
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

const Connector = ({ connectorProps, isSelected, onSelect, onChange }) => {
    const groupRef = useRef();

    useEffect(() => {}, [isSelected]);

    const handleDragEnd = (e) => {
        if (e.target !== groupRef.current) return;
        onChange({
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    const {
        type,
        points: rawPoints,
        stroke,
        strokeWidth,
        x,
        y,
    } = connectorProps;

    const color = stroke || '#374151';
    const width = strokeWidth || 2;
    const points = rawPoints || [0, 0, 100, 100];

    if (type === 'freehand') {
        return (
            <Line
                id={connectorProps.id}
                ref={groupRef}
                x={x || 0}
                y={y || 0}
                points={points}
                stroke={color}
                strokeWidth={width}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={handleDragEnd}
                hitStrokeWidth={20}
            />
        );
    }

    const { startMarker, endMarker, lineStyle } = resolveMarkers(connectorProps);
    const size = getMarkerSize(width);
    const startIn = markerInset(startMarker, size);
    const endIn = markerInset(endMarker, size);
    const shaftPoints = insetShaftPoints(points, startIn, endIn);
    const dash = getDashForLineStyle(lineStyle);
    const { startTip, endTip } = getEndpointDirections(points);
    const startGeom = buildMarkerGeometry(startMarker, startTip.x, startTip.y, startTip.ux, startTip.uy, size);
    const endGeom = buildMarkerGeometry(endMarker, endTip.x, endTip.y, endTip.ux, endTip.uy, size);

    return (
        <Group
            id={connectorProps.id}
            ref={groupRef}
            x={x || 0}
            y={y || 0}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={handleDragEnd}
        >
            <Line
                points={points}
                stroke="transparent"
                strokeWidth={Math.max(20, width + 16)}
                perfectDrawEnabled={false}
            />
            <Line
                points={shaftPoints}
                stroke={color}
                strokeWidth={width}
                dash={dash || []}
                dashEnabled={Boolean(dash)}
                lineCap="round"
                lineJoin="round"
                hitStrokeWidth={20}
                listening={false}
            />
            <MarkerShape geom={startGeom} stroke={color} strokeWidth={Math.max(1.5, width)} />
            <MarkerShape geom={endGeom} stroke={color} strokeWidth={Math.max(1.5, width)} />
            {isSelected && (
                <EndpointHandles points={points} onChange={onChange} />
            )}
        </Group>
    );
};

export default Connector;
