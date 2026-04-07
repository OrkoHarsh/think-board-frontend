import { Group, Rect, Text } from 'react-konva';
import { useRef, useEffect } from 'react';

const StickyNote = ({ noteProps, isSelected, onSelect, onChange }) => {
    const groupRef = useRef();

    const noteWidth = noteProps.width || 150;
    const noteHeight = noteProps.height || 150;

    useEffect(() => {}, [isSelected]); // isSelected used for Transformer in CanvasStage

    const handleDragEnd = (e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
    };

    const handleTransformEnd = () => {
        const node = groupRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(50, noteWidth * scaleX),
            height: Math.max(50, noteHeight * scaleY),
        });
    };

    const handleDblClick = () => {
        const stage = groupRef.current.getStage();
        const stageBox = stage.container().getBoundingClientRect();

        const transform = groupRef.current.getAbsoluteTransform().copy();
        const topLeft = transform.point({ x: 0, y: 0 });
        const bottomRight = transform.point({ x: noteWidth, y: noteHeight });

        const left = stageBox.left + topLeft.x;
        const top = stageBox.top + topLeft.y;
        const areaWidth = bottomRight.x - topLeft.x;
        const areaHeight = bottomRight.y - topLeft.y;

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = noteProps.text || '';
        Object.assign(textarea.style, {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${areaWidth}px`,
            height: `${areaHeight}px`,
            fontSize: `${16 * (stage.scaleX() || 1)}px`,
            border: '2px solid #f59e0b',
            borderRadius: '4px',
            padding: `${10 * (stage.scaleX() || 1)}px`,
            margin: '0',
            overflow: 'hidden',
            background: noteProps.fill || '#FEF3C7',
            outline: 'none',
            resize: 'none',
            color: '#374151',
            zIndex: '1000',
            fontFamily: 'sans-serif',
            boxSizing: 'border-box',
        });
        textarea.focus();
        textarea.select();

        let escaped = false;
        const done = () => {
            if (escaped) return;
            const newText = textarea.value;
            if (document.body.contains(textarea)) {
                document.body.removeChild(textarea);
            }
            onChange({ text: newText });
        };

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                escaped = true;
                if (document.body.contains(textarea)) document.body.removeChild(textarea);
            }
        });
        textarea.addEventListener('blur', done);
    };

    return (
        <>
            <Group
                id={noteProps.id}
                x={noteProps.x}
                y={noteProps.y}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDblClick={handleDblClick}
                onDblTap={handleDblClick}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
                ref={groupRef}
            >
                <Rect
                    width={noteWidth}
                    height={noteHeight}
                    fill={noteProps.fill || '#FEF3C7'}
                    shadowColor="black"
                    shadowBlur={5}
                    shadowOpacity={0.2}
                    shadowOffsetX={2}
                    shadowOffsetY={2}
                    cornerRadius={4}
                />
                <Text
                    x={10}
                    y={10}
                    width={noteWidth - 20}
                    height={noteHeight - 20}
                    text={noteProps.text || 'Double-click to edit'}
                    fontSize={16}
                    fontFamily="sans-serif"
                    fill="#374151"
                    wrap="word"
                    listening={false}
                />
            </Group>
        </>
    );
};

export default StickyNote;
