import { Line, Arrow as KonvaArrow } from 'react-konva';
import { useRef, useEffect } from 'react';

const Connector = ({ connectorProps, isSelected, onSelect, onChange }) => {
    const lineRef = useRef();

    // isSelected used externally by shared Transformer in CanvasStage
    useEffect(() => {}, [isSelected]);

    const handleDragEnd = (e) => {
        onChange({
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    const { type, points, stroke, strokeWidth, x, y, dash } = connectorProps;

    const commonProps = {
        id: connectorProps.id,
        ref: lineRef,
        x: x || 0,
        y: y || 0,
        points: points || [0, 0, 100, 100],
        stroke: stroke || '#374151',
        strokeWidth: strokeWidth || 2,
        draggable: true,
        onClick: onSelect,
        onTap: onSelect,
        onDragEnd: handleDragEnd,
        hitStrokeWidth: 20,
    };

    return (
        <>
            {type === 'arrow' ? (
                <KonvaArrow
                    {...commonProps}
                    pointerLength={10}
                    pointerWidth={10}
                    fill={stroke || '#374151'}
                />
            ) : type === 'freehand' ? (
                <Line
                    {...commonProps}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                />
            ) : (
                <Line {...commonProps} dash={dash} />
            )}
        </>
    );
};

export default Connector;
