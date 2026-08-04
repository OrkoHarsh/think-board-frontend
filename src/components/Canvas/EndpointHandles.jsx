import { Circle } from 'react-konva';
import { useEffect, useRef, useState } from 'react';

/**
 * Draggable endpoint (and bend) handles for resizing connectors.
 */
const EndpointHandles = ({ points, onChange, stroke = '#6366f1' }) => {
    const [draft, setDraft] = useState(points);
    const draftRef = useRef(points);
    const draggingRef = useRef(false);

    useEffect(() => {
        if (!draggingRef.current) {
            draftRef.current = points;
            setDraft(points);
        }
    }, [points]);

    if (!draft || draft.length < 4) return null;

    const applyPoint = (index, x, y) => {
        const next = [...draftRef.current];
        next[index] = x;
        next[index + 1] = y;
        draftRef.current = next;
        setDraft(next);
        onChange({ points: next });
    };

    const handles = [];
    handles.push({ key: 'start', index: 0, x: draft[0], y: draft[1], r: 7 });
    for (let i = 2; i < draft.length - 2; i += 2) {
        handles.push({
            key: `mid-${i}`,
            index: i,
            x: draft[i],
            y: draft[i + 1],
            r: 5,
        });
    }
    const last = draft.length - 2;
    handles.push({ key: 'end', index: last, x: draft[last], y: draft[last + 1], r: 7 });

    return handles.map((h) => (
        <Circle
            key={h.key}
            x={h.x}
            y={h.y}
            radius={h.r}
            fill="#ffffff"
            stroke={stroke}
            strokeWidth={2}
            draggable
            onMouseDown={(e) => {
                e.cancelBubble = true;
            }}
            onTouchStart={(e) => {
                e.cancelBubble = true;
            }}
            onDragStart={(e) => {
                e.cancelBubble = true;
                draggingRef.current = true;
            }}
            onDragMove={(e) => {
                e.cancelBubble = true;
                applyPoint(h.index, e.target.x(), e.target.y());
            }}
            onDragEnd={(e) => {
                e.cancelBubble = true;
                applyPoint(h.index, e.target.x(), e.target.y());
                draggingRef.current = false;
            }}
            hitStrokeWidth={12}
        />
    ));
};

export default EndpointHandles;
