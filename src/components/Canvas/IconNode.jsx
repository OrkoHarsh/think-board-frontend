import { useState, useEffect } from 'react';
import { Group, Image as KonvaImage, Text, Rect } from 'react-konva';
import { getIconUrl } from '../Icons/iconRegistry';

const LABEL_HEIGHT = 18;
const LABEL_GAP = 4;

const IconNode = ({ iconProps, isSelected, onSelect, onChange }) => {
    const { id, x, y, width = 64, height = 64, iconKey, label } = iconProps;
    const [image, setImage] = useState(null);

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

    const handleDragEnd = (e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
    };

    const handleTransformEnd = (e) => {
        const node = e.target;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(24, width * sx),
            height: Math.max(24, height * sy),
        });
    };

    const totalHeight = height + LABEL_GAP + LABEL_HEIGHT;

    return (
        <Group
            id={id}
            x={x}
            y={y}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
        >
            {/* Invisible hit area covering icon + label */}
            <Rect
                width={width}
                height={totalHeight}
                fill="transparent"
            />

            {/* Icon image — fallback placeholder if load fails */}
            {image ? (
                <KonvaImage
                    image={image}
                    width={width}
                    height={height}
                />
            ) : (
                <Rect
                    width={width}
                    height={height}
                    fill="#f3f4f6"
                    cornerRadius={8}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                />
            )}

            {/* Label */}
            <Text
                text={label}
                y={height + LABEL_GAP}
                width={width}
                fontSize={10}
                fontFamily="Inter, system-ui, sans-serif"
                fill="#4b5563"
                align="center"
                ellipsis
                wrap="none"
                listening={false}
            />
        </Group>
    );
};

export default IconNode;
