import { Group, Rect, Line, Text } from 'react-konva';
import { useRef } from 'react';
import {
    UML_HEADER,
    UML_ROW,
    UML_PAD,
    UML_MIN_WIDTH,
    toLines,
    compartmentHeight,
    umlClassHeight,
} from '../../utils/umlClass';

const UmlClassNode = ({ nodeProps, isSelected, onSelect, onChange }) => {
    const groupRef = useRef();

    const width = nodeProps.width || 220;
    const attributes = toLines(nodeProps.attributes);
    const methods = toLines(nodeProps.methods);
    const height = umlClassHeight(nodeProps);

    const fill = nodeProps.fill && nodeProps.fill !== 'transparent' ? nodeProps.fill : '#FFFFFF';
    const stroke = nodeProps.stroke || '#94A3B8';
    const fontFamily = nodeProps.fontFamily || 'Geist Sans, system-ui, sans-serif';
    const fontSize = nodeProps.fontSize || 13;

    const attrTop = UML_HEADER;
    const attrHeight = compartmentHeight(attributes);
    const methodTop = attrTop + attrHeight;
    const methodHeight = compartmentHeight(methods);

    const handleDragEnd = (e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
    };

    const handleTransformEnd = () => {
        const node = groupRef.current;
        const scaleX = node.scaleX();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(UML_MIN_WIDTH, width * scaleX),
            height,
        });
    };

    const editSection = (section) => {
        const stage = groupRef.current.getStage();
        if (!stage) return;
        const stageBox = stage.container().getBoundingClientRect();
        const scale = stage.scaleX() || 1;

        const bounds =
            section === 'name'
                ? { top: 0, height: UML_HEADER }
                : section === 'attributes'
                ? { top: attrTop, height: attrHeight }
                : { top: methodTop, height: methodHeight };

        const transform = groupRef.current.getAbsoluteTransform().copy();
        const topLeft = transform.point({ x: 0, y: bounds.top });
        const bottomRight = transform.point({ x: width, y: bounds.top + bounds.height });

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value =
            section === 'name'
                ? nodeProps.className || ''
                : (section === 'attributes' ? attributes : methods).join('\n');

        Object.assign(textarea.style, {
            position: 'fixed',
            top: `${stageBox.top + topLeft.y}px`,
            left: `${stageBox.left + topLeft.x}px`,
            width: `${bottomRight.x - topLeft.x}px`,
            height: `${bottomRight.y - topLeft.y}px`,
            fontSize: `${(section === 'name' ? fontSize + 1 : fontSize) * scale}px`,
            fontFamily,
            fontWeight: section === 'name' ? 'bold' : 'normal',
            textAlign: section === 'name' ? 'center' : 'left',
            border: '2px solid #6366f1',
            borderRadius: '4px',
            padding: `${UML_PAD * scale}px`,
            margin: '0',
            overflow: 'hidden',
            background: fill,
            outline: 'none',
            resize: 'none',
            color: '#1f2937',
            zIndex: '1000',
            lineHeight: `${UML_ROW * scale}px`,
            boxSizing: 'border-box',
        });
        textarea.focus();
        textarea.select();

        let escaped = false;
        const done = () => {
            if (escaped) return;
            const raw = textarea.value;
            if (document.body.contains(textarea)) document.body.removeChild(textarea);

            if (section === 'name') {
                onChange({ className: raw.replace(/\n/g, ' ').trim() });
                return;
            }
            const lines = raw
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);
            const next =
                section === 'attributes'
                    ? { attributes: lines, methods }
                    : { attributes, methods: lines };
            onChange({ ...next, height: umlClassHeight(next) });
        };

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                escaped = true;
                if (document.body.contains(textarea)) document.body.removeChild(textarea);
            }
            if (e.key === 'Enter' && section === 'name') {
                e.preventDefault();
                textarea.blur();
            }
        });
        textarea.addEventListener('blur', done);
    };

    const renderMembers = (lines, top) =>
        (lines.length ? lines : ['']).map((line, i) => (
            <Text
                key={`${top}-${i}-${line}`}
                x={UML_PAD}
                y={top + UML_PAD + i * UML_ROW}
                width={Math.max(8, width - UML_PAD * 2)}
                height={UML_ROW}
                text={line}
                fontSize={fontSize}
                fontFamily={fontFamily}
                fill="#374151"
                verticalAlign="middle"
                wrap="none"
                ellipsis
                listening={false}
            />
        ));

    return (
        <Group
            id={nodeProps.id}
            ref={groupRef}
            x={nodeProps.x || 0}
            y={nodeProps.y || 0}
            width={width}
            height={height}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
        >
            <Rect
                width={width}
                height={height}
                fill={fill}
                stroke={isSelected ? '#6366f1' : stroke}
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={4}
            />

            <Rect
                width={width}
                height={UML_HEADER}
                fill="transparent"
                onDblClick={() => editSection('name')}
                onDblTap={() => editSection('name')}
            />
            <Text
                x={UML_PAD}
                y={0}
                width={Math.max(8, width - UML_PAD * 2)}
                height={UML_HEADER}
                text={nodeProps.className || 'ClassName'}
                align="center"
                verticalAlign="middle"
                fontSize={fontSize + 1}
                fontFamily={fontFamily}
                fontStyle="bold"
                fill="#111827"
                wrap="none"
                ellipsis
                listening={false}
            />

            <Line points={[0, attrTop, width, attrTop]} stroke={stroke} strokeWidth={1} listening={false} />
            <Rect
                y={attrTop}
                width={width}
                height={attrHeight}
                fill="transparent"
                onDblClick={() => editSection('attributes')}
                onDblTap={() => editSection('attributes')}
            />
            {renderMembers(attributes, attrTop)}

            <Line points={[0, methodTop, width, methodTop]} stroke={stroke} strokeWidth={1} listening={false} />
            <Rect
                y={methodTop}
                width={width}
                height={methodHeight}
                fill="transparent"
                onDblClick={() => editSection('methods')}
                onDblTap={() => editSection('methods')}
            />
            {renderMembers(methods, methodTop)}
        </Group>
    );
};

export default UmlClassNode;
