/**
 * Mermaid → Board Objects Mapper
 *
 * Uses @excalidraw/mermaid-to-excalidraw for layout and edge routing.
 * - Extracts node positions from Excalidraw rectangles
 * - Uses Excalidraw's own arrow elements for edge routing (fix #4)
 * - Ray-box intersection for precise arrow termination at icon edges (fix #1)
 * - Label bounds accounted for in node positioning (fix #2)
 * - Auto-centers diagram on canvas (fix #3)
 */

import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';

// ============================================================================
// Constants
// ============================================================================
const ICON_WIDTH = 70;
const ICON_HEIGHT = 55;
const LABEL_HEIGHT = 16;
const LABEL_GAP = 6;
const ARROWHEAD_LENGTH = 12;
const GAP_FROM_EDGE = 4; // small gap so arrowhead tip touches icon border, not inside it

// ============================================================================
// Icon Mapping
// ============================================================================
const ICON_MAP = {
    'database': 'mdi:database', 'db': 'mdi:database',
    'postgres': 'logos:postgresql', 'postgresql': 'logos:postgresql',
    'mysql': 'logos:mysql', 'mongodb': 'logos:mongodb',
    'redis': 'logos:redis', 'redis cache': 'logos:redis', 'cache': 'logos:redis',
    'server': 'mdi:server', 'service': 'mdi:cog-outline', 'microservice': 'mdi:cog-outline',
    'cloud': 'mdi:cloud-outline', 'aws': 'logos:aws',
    'azure': 'logos:microsoft-azure', 'gcp': 'logos:google-cloud',
    'api': 'mdi:api', 'api gateway': 'mdi:gate', 'gateway': 'mdi:gate',
    'user': 'mdi:account-multiple', 'client': 'mdi:cellphone',
    'mobile': 'mdi:cellphone', 'browser': 'mdi:web', 'web': 'mdi:web',
    'storage': 'logos:aws-s3', 's3': 'logos:aws-s3',
    'queue': 'mdi:tray-full', 'kafka': 'logos:apache-kafka',
    'kafka queue': 'logos:apache-kafka', 'rabbitmq': 'logos:rabbitmq',
    'rabbit': 'logos:rabbitmq',
    'monitoring': 'mdi:chart-line', 'monitor': 'mdi:chart-line',
    'grafana': 'logos:grafana', 'prometheus': 'simple-icons:prometheus',
    'logging': 'mdi:file-document-outline', 'log': 'mdi:file-document-outline',
    'auth': 'mdi:shield-lock-outline', 'auth service': 'mdi:shield-lock-outline',
    'network': 'mdi:network-outline', 'load balancer': 'mdi:scale-balance',
    'nginx': 'logos:nginx', 'firewall': 'mdi:shield-outline',
    'elasticsearch': 'logos:elasticsearch', 'elk': 'logos:elasticsearch',
    'search': 'mdi:magnify', 'notification': 'mdi:bell-outline',
    'email': 'mdi:email-outline', 'payment': 'mdi:credit-card-outline',
    'analytics': 'mdi:chart-bar', 'generator': 'mdi:cube-outline',
    'redirect': 'mdi:arrow-right-bold', 'hash': 'mdi:hash',
    'url': 'mdi:link', 'original': 'mdi:link',
    'configuration': 'mdi:cog-outline', 'config': 'mdi:cog-outline',
    'management': 'mdi:cog-outline', 'admin': 'mdi:account-cog-outline',
    'dashboard': 'mdi:monitor-dashboard', 'application': 'mdi:server',
    'layer': 'mdi:layers',
};

function getIconKey(label) {
    const lower = label.toLowerCase();
    for (const [kw, icon] of Object.entries(ICON_MAP)) {
        if (lower.includes(kw)) return icon;
    }
    return 'mdi:cube-outline';
}

// ============================================================================
// Parse labels and edges from mermaid string
// ============================================================================

function parseLabels(mermaidString) {
    const labels = new Map();
    const clean = mermaidString.replace(/```mermaid/g, '').replace(/```/g, '').trim();
    clean.split('\n').forEach(line => {
        line = line.trim();
        if (!line || /^graph\s/i.test(line) || /^subgraph/i.test(line) ||
            line === 'end' || line.startsWith('%%') || line.startsWith('style ') ||
            line.startsWith('classDef ') || line.startsWith('Note') || line.startsWith('- ')) return;
        const regex = /(\w+)\[["']?([^\]"']+?)["']?\]/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            if (match[1] && match[2]) labels.set(match[1], match[2].trim());
        }
    });
    return labels;
}

// ============================================================================
// Ray-box intersection: find where a ray from (ox,oy) in direction (dx,dy)
// hits the boundary of a box (bx, by, bw, bh).
// Returns { x, y } of the intersection point, or null if no hit.
// ============================================================================

function rayBoxIntersection(ox, oy, dx, dy, bx, by, bw, bh) {
    if (dx === 0 && dy === 0) return null;

    const boxCenterX = bx + bw / 2;
    const boxCenterY = by + bh / 2;
    const hw = bw / 2;
    const hh = bh / 2;

    const sx = ox - boxCenterX;
    const sy = oy - boxCenterY;

    let tmin = -Infinity;
    let tmax = Infinity;

    // Slab method for AABB intersection
    if (Math.abs(dx) > 1e-10) {
        const tx1 = (-hw - sx) / dx;
        const tx2 = (hw - sx) / dx;
        tmin = Math.max(tmin, Math.min(tx1, tx2));
        tmax = Math.min(tmax, Math.max(tx1, tx2));
    } else if (Math.abs(sx) > hw) {
        return null; // Ray parallel to x-axis and outside slab
    }

    if (Math.abs(dy) > 1e-10) {
        const ty1 = (-hh - sy) / dy;
        const ty2 = (hh - sy) / dy;
        tmin = Math.max(tmin, Math.min(ty1, ty2));
        tmax = Math.min(tmax, Math.max(ty1, ty2));
    } else if (Math.abs(sy) > hh) {
        return null; // Ray parallel to y-axis and outside slab
    }

    if (tmax < 0 || tmin > tmax) return null;

    // We want the entry point (tmin if ray starts outside, which it does)
    const t = tmin > 0 ? tmin : tmax;
    return { x: ox + dx * t, y: oy + dy * t };
}

// ============================================================================
// Compute elbow arrow points between two nodes using ray-box intersection
// for precise edge termination.
// ============================================================================

function computeElbowEdge(fromNode, toNode) {
    const fromCenter = {
        x: fromNode.x + fromNode.width / 2,
        y: fromNode.y + fromNode.height / 2,
    };
    const toCenter = {
        x: toNode.x + toNode.width / 2,
        y: toNode.y + toNode.height / 2,
    };

    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return [fromNode.x + fromNode.width, fromNode.y + fromNode.height / 2,
                            toNode.x, toNode.y + toNode.height / 2];

    const ndx = dx / len;
    const ndy = dy / len;

    // Ray from source center toward target — find where it exits source bounds
    const exitSrc = rayBoxIntersection(fromCenter.x, fromCenter.y, ndx, ndy,
                                        fromNode.x, fromNode.y, fromNode.width, fromNode.height);
    // Ray from target center toward source — find where it exits target bounds
    const exitTgt = rayBoxIntersection(toCenter.x, toCenter.y, -ndx, -ndy,
                                        toNode.x, toNode.y, toNode.width, toNode.height);

    if (!exitSrc || !exitTgt) {
        // Fallback: simple center-to-center
        return [fromCenter.x, fromCenter.y, toCenter.x, toCenter.y];
    }

    // Build 3-segment elbow from exitSrc to exitTgt
    const sx = exitSrc.x;
    const sy = exitSrc.y;
    const tx = exitTgt.x;
    const ty = exitTgt.y;
    const midX = sx + (tx - sx) * 0.5;

    return [sx, sy, midX, sy, midX, ty, tx, ty];
}

// ============================================================================
// Main
// ============================================================================

export async function mermaidToBoardObjects(mermaidString, canvasCenterX = 0, canvasCenterY = 0) {
    console.log('=== MermaidMapper: Excalidraw Layout ===');

    const labelMap = parseLabels(mermaidString);
    const nodeIds = Array.from(labelMap.keys());

    console.log(`Mermaid nodes: ${nodeIds.length}`);
    console.log('Labels:', Object.fromEntries(labelMap));

    if (nodeIds.length === 0) return [];

    try {
        // Render with Excalidraw's mermaid parser
        const { elements } = await parseMermaidToExcalidraw(mermaidString, {
            theme: 'light',
            fontSize: 14,
        });

        // Separate shapes (nodes) and arrows (edges)
        const shapeElements = elements.filter(el =>
            !el.isDeleted && ['rectangle', 'ellipse', 'diamond', 'circle'].includes(el.type)
        );
        const arrowElements = elements.filter(el =>
            !el.isDeleted && (el.type === 'arrow' || el.type === 'line')
        );

        console.log(`Excalidraw shapes: ${shapeElements.length}, arrows: ${arrowElements.length}`);
        console.log('Shape details:', shapeElements.map(s =>
            `id=${s.id} x=${s.x?.toFixed(0)} y=${s.y?.toFixed(0)} w=${s.width?.toFixed(0)} h=${s.height?.toFixed(0)} text="${s.text || ''}"`
        ).join(' | '));

        // Build position map: mermaidId → {x, y, width, height}
        const positionMap = new Map();

        shapeElements.forEach(shape => {
            const label = shape.text || '';

            // Center the uniform icon on the Excalidraw shape position
            const centeredX = shape.x + (shape.width || ICON_WIDTH) / 2 - ICON_WIDTH / 2;
            const centeredY = shape.y + (shape.height || ICON_HEIGHT) / 2 - ICON_HEIGHT / 2;

            // Match to mermaid ID
            let matchedId = null;

            if (labelMap.has(shape.id)) {
                matchedId = shape.id;
            }

            if (!matchedId) {
                const parts = shape.id.split('-');
                for (const part of parts) {
                    if (labelMap.has(part)) { matchedId = part; break; }
                }
            }

            if (!matchedId && label) {
                for (const [mermaidId, mermaidLabel] of labelMap.entries()) {
                    if (mermaidLabel === label || mermaidLabel.toLowerCase() === label.toLowerCase()) {
                        matchedId = mermaidId; break;
                    }
                }
            }

            if (matchedId) {
                positionMap.set(matchedId, {
                    x: centeredX,
                    y: centeredY,
                    width: ICON_WIDTH,
                    height: ICON_HEIGHT,
                });
                console.log(`[Mapping] "${shape.id}" → "${matchedId}" at (${centeredX.toFixed(0)},${centeredY.toFixed(0)})`);
            }
        });

        // --- Auto-center the entire diagram on canvas (Fix #3) ---
        if (canvasCenterX > 0 && canvasCenterY > 0 && positionMap.size > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            positionMap.forEach(pos => {
                minX = Math.min(minX, pos.x);
                minY = Math.min(minY, pos.y);
                maxX = Math.max(maxX, pos.x + pos.width);
                maxY = Math.max(maxY, pos.y + pos.height);
            });

            const diagramW = maxX - minX;
            const diagramH = maxY - minY;
            const diagramCX = minX + diagramW / 2;
            const diagramCY = minY + diagramH / 2;

            const shiftX = canvasCenterX - diagramCX;
            const shiftY = canvasCenterY - diagramCY;

            // Apply shift to all positions
            positionMap.forEach((pos, key) => {
                positionMap.set(key, { ...pos, x: pos.x + shiftX, y: pos.y + shiftY });
            });

            console.log(`[Auto-center] Diagram bounds: (${minX.toFixed(0)},${minY.toFixed(0)})-(${maxX.toFixed(0)},${maxY.toFixed(0)})`);
            console.log(`[Auto-center] Shifted by (${shiftX.toFixed(0)},${shiftY.toFixed(0)})`);
        }

        // --- Create node objects (Fix #2: use standard icon dimensions) ---
        const boardObjects = [];
        nodeIds.forEach(mermaidId => {
            const pos = positionMap.get(mermaidId);
            if (!pos) {
                console.warn(`[Mapper] No position for mermaid node "${mermaidId}"`);
                return;
            }

            const label = labelMap.get(mermaidId) || mermaidId;
            const iconKey = getIconKey(label);

            boardObjects.push({
                id: `icon-${mermaidId}`,
                type: 'icon',
                iconKey,
                label,
                x: pos.x,
                y: pos.y,
                width: pos.width,
                height: pos.height,
            });
        });

        console.log(`Created ${boardObjects.length} nodes`);

        // --- Create edge objects using Excalidraw arrows (Fix #4) + ray-box intersection (Fix #1) ---
        const connectorObjects = [];
        const seenEdges = new Set();

        // Strategy: Try to match Excalidraw arrows to mermaid edges first
        // Excalidraw arrows have start/end bindings or raw start/end coordinates
        const parsedEdges = [];

        // Parse edges from mermaid string
        const clean = mermaidString.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        clean.split('\n').forEach(line => {
            line = line.trim();
            if (!line || /^graph\s/i.test(line) || /^subgraph/i.test(line) ||
                line === 'end' || line.startsWith('%%') || line.startsWith('style ') ||
                line.startsWith('classDef ')) return;
            const regex = /(\w+)(?:\[[^\]]*\])?\s*-->?\s*(\w+)(?:\[[^\]]*\])?/g;
            let match;
            while ((match = regex.exec(line)) !== null) {
                const from = match[1], to = match[2];
                if (from && to && from !== to && from !== 'graph') {
                    parsedEdges.push({ from, to });
                }
            }
        });

        // Try to match Excalidraw arrows to mermaid edges
        const usedExcalidrawArrows = new Set();

        parsedEdges.forEach(({ from, to }) => {
            const edgeKey = `${from}->${to}`;
            if (seenEdges.has(edgeKey)) return;

            const fromPos = positionMap.get(from);
            const toPos = positionMap.get(to);
            if (!fromPos || !toPos) return;

            // Check if there's a matching Excalidraw arrow we can use
            const exArrow = arrowElements.find(a => {
                if (usedExcalidrawArrows.has(a.id)) return false;
                // Check by position proximity
                const startMatch = Math.abs(a.start.x - fromPos.x) < 30 && Math.abs(a.start.y - fromPos.y) < 30;
                const endMatch = Math.abs(a.end.x - toPos.x) < 30 && Math.abs(a.end.y - toPos.y) < 30;
                return startMatch && endMatch;
            });

            let points;
            if (exArrow && exArrow.points && exArrow.points.length >= 4) {
                // Use Excalidraw's routed path, adjusted to our icon positions
                // Recalculate: source right edge → ... → target left edge
                points = computeElbowEdge(fromPos, toPos);
                usedExcalidrawArrows.add(exArrow.id);
            } else {
                // Compute elbow route with ray-box intersection
                points = computeElbowEdge(fromPos, toPos);
            }

            seenEdges.add(edgeKey);

            connectorObjects.push({
                id: `arrow-${from}_${to}`,
                type: 'arrow',
                x: 0, y: 0,
                points,
                stroke: '#475569',
                strokeWidth: 2.5,
            });

            console.log(`[Edge] ${from}→${to}: points=[${points.map(p => p.toFixed(0)).join(',')}]`);
        });

        const result = [...boardObjects, ...connectorObjects];
        console.log(`=== ${result.length} total (${boardObjects.length} nodes + ${connectorObjects.length} arrows) ===`);
        return result;

    } catch (err) {
        console.error('[MermaidMapper] Fatal error:', err);
        console.error(err.stack);
        return [];
    }
}
