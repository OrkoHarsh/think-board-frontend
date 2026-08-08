/**
 * Maps Mermaid `classDiagram` output to ThinkBoard objects.
 *
 * Classes become `umlClass` nodes (name / attributes / methods compartments) and relationships
 * become arrow connectors between them. Laid out on a simple grid; the backend caps the model at
 * eight classes, so a grid stays readable without a full layout pass.
 */
import { umlClassHeight, UML_ROW, UML_HEADER, UML_PAD, UML_DEFAULT_WIDTH } from './umlClass';

const BOX_WIDTH = UML_DEFAULT_WIDTH;
const COL_GAP = 90;
const ROW_GAP = 70;
const COLUMNS = 3;

const RELATION_TOKENS = ['<|--', '--|>', '*--', '--*', 'o--', '--o', '..>', '<..', '-->', '<--', '--'];

const stripFences = (raw) =>
    String(raw || '')
        .replace(/```mermaid/gi, '')
        .replace(/```/g, '')
        .trim();

/** A member is a method when it carries a call signature. */
const isMethod = (member) => /\(\s*\)?/.test(member) && member.includes('(');

/**
 * Parses the subset of classDiagram syntax the backend validator enforces:
 * `class Name { ... }` blocks plus one relationship per line.
 */
export function parseClassDiagram(raw) {
    const text = stripFences(raw);
    const lines = text.split(/\r?\n/).map((l) => l.trim());

    const classes = [];
    const byName = new Map();
    const relations = [];

    let current = null;

    for (const line of lines) {
        if (!line || /^classDiagram/i.test(line) || line.startsWith('%%')) continue;

        if (current) {
            if (line === '}') {
                current = null;
                continue;
            }
            const member = line.replace(/^[+\-#~]\s*/, '').trim();
            if (!member) continue;
            if (isMethod(member)) current.methods.push(member);
            else current.attributes.push(member);
            continue;
        }

        const openBlock = line.match(/^class\s+([A-Za-z][\w]*)\s*\{$/);
        if (openBlock) {
            const entry = { name: openBlock[1], attributes: [], methods: [] };
            classes.push(entry);
            byName.set(entry.name, entry);
            current = entry;
            continue;
        }

        // Bare declaration without a body: `class Name`
        const bare = line.match(/^class\s+([A-Za-z][\w]*)\s*$/);
        if (bare && !byName.has(bare[1])) {
            const entry = { name: bare[1], attributes: [], methods: [] };
            classes.push(entry);
            byName.set(entry.name, entry);
            continue;
        }

        const token = RELATION_TOKENS.find((t) => line.includes(t));
        if (!token) continue;

        const [leftRaw, rightRaw] = line.split(token);
        const from = (leftRaw || '').replace(/"[^"]*"/g, '').trim();
        const right = (rightRaw || '').split(':')[0];
        const to = (right || '').replace(/"[^"]*"/g, '').trim();
        const label = line.includes(':') ? line.split(':').slice(1).join(':').trim() : '';

        if (/^[A-Za-z][\w]*$/.test(from) && /^[A-Za-z][\w]*$/.test(to)) {
            relations.push({ from, to, token, label });
        }
    }

    return { classes, relations };
}

/** Centre point of a laid-out box, used as the connector anchor. */
const centerOf = (box) => ({ x: box.x + BOX_WIDTH / 2, y: box.y + box.height / 2 });

/**
 * Converts a Mermaid class diagram into board objects positioned around a canvas point.
 * Returns an empty array when nothing parseable was found, so callers can fall back.
 */
export function classDiagramToBoardObjects(mermaid, canvasCenterX = 0, canvasCenterY = 0) {
    const { classes, relations } = parseClassDiagram(mermaid);
    if (!classes.length) return [];

    const columns = Math.min(COLUMNS, classes.length);
    const boxes = new Map();

    const laidOut = classes.map((cls, index) => {
        const node = {
            className: cls.name,
            attributes: cls.attributes,
            methods: cls.methods,
        };
        const height = umlClassHeight(node);
        return { ...node, index, height };
    });

    // Row heights vary with content, so track each row's tallest box.
    const rowCount = Math.ceil(laidOut.length / columns);
    const rowHeights = [];
    for (let row = 0; row < rowCount; row++) {
        const inRow = laidOut.filter((b) => Math.floor(b.index / columns) === row);
        rowHeights.push(Math.max(...inRow.map((b) => b.height), UML_HEADER + UML_ROW + UML_PAD * 2));
    }

    const gridWidth = columns * BOX_WIDTH + (columns - 1) * COL_GAP;
    const gridHeight = rowHeights.reduce((sum, h) => sum + h, 0) + (rowCount - 1) * ROW_GAP;
    const originX = canvasCenterX - gridWidth / 2;
    const originY = canvasCenterY - gridHeight / 2;

    const objects = [];

    laidOut.forEach((box) => {
        const col = box.index % columns;
        const row = Math.floor(box.index / columns);
        const offsetY = rowHeights.slice(0, row).reduce((sum, h) => sum + h + ROW_GAP, 0);

        const placed = {
            id: `class-${box.className}`,
            type: 'umlClass',
            x: originX + col * (BOX_WIDTH + COL_GAP),
            y: originY + offsetY,
            width: BOX_WIDTH,
            height: box.height,
            fill: '#FFFFFF',
            stroke: '#94A3B8',
            className: box.className,
            attributes: box.attributes,
            methods: box.methods,
            fontFamily: 'Geist Sans, system-ui, sans-serif',
            fontSize: 13,
        };
        boxes.set(box.className, placed);
        objects.push(placed);
    });

    relations.forEach((rel, i) => {
        const fromBox = boxes.get(rel.from);
        const toBox = boxes.get(rel.to);
        if (!fromBox || !toBox) return;

        const a = centerOf(fromBox);
        const b = centerOf(toBox);
        const inherits = rel.token === '<|--' || rel.token === '--|>';

        objects.push({
            id: `class-rel-${i}`,
            type: 'arrow',
            x: 0,
            y: 0,
            points: [a.x, a.y, b.x, b.y],
            stroke: '#64748B',
            strokeWidth: 1.5,
            lineStyle: inherits ? 'dashed' : 'solid',
            endMarker: 'arrow',
            text: rel.label || '',
        });
    });

    return objects;
}

export default classDiagramToBoardObjects;
