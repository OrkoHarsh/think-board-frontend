/**
 * Mermaid → Board Objects Mapper
 * 
 * Uses @excalidraw/mermaid-to-excalidraw for layout.
 * Maps mermaid node IDs (A, B, C) to Excalidraw shape IDs via label matching.
 * Creates animated icons + animated elbow connectors.
 */

import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';

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
    const labels = new Map(); // mermaidId → label
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

function parseEdges(mermaidString) {
    const edges = [];
    const clean = mermaidString.replace(/```mermaid/g, '').replace(/```/g, '').trim();
    clean.split('\n').forEach(line => {
        line = line.trim();
        if (!line || /^graph\s/i.test(line) || /^subgraph/i.test(line) ||
            line === 'end' || line.startsWith('%%') || line.startsWith('style ') ||
            line.startsWith('classDef ')) return;
        // Match edges: word --> word (brackets optional on both sides)
        // Examples: A[Client] --> B[API Gateway], B --> C, C --> F[PostgreSQL]
        const regex = /(\w+)(?:\[[^\]]*\])?\s*-->?\s*(\w+)(?:\[[^\]]*\])?/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            const from = match[1], to = match[2];
            if (from && to && from !== to && from !== 'graph') {
                edges.push({ from, to });
            }
        }
    });
    return edges;
}

// ============================================================================
// Main
// ============================================================================

export async function mermaidToBoardObjects(mermaidString, offsetX = 0, offsetY = 0) {
    console.log('=== MermaidMapper: Excalidraw Layout ===');

    const labelMap = parseLabels(mermaidString);
    const edgeList = parseEdges(mermaidString);
    const nodeIds = Array.from(labelMap.keys());

    console.log(`Mermaid nodes: ${nodeIds.length}`);
    console.log('Labels:', Object.fromEntries(labelMap));
    console.log('Edges:', edgeList.map(e => `${e.from}→${e.to}`).join(', '));

    if (nodeIds.length === 0) return [];

    try {
        // Render with Excalidraw's mermaid parser
        const { elements } = await parseMermaidToExcalidraw(mermaidString, {
            theme: 'light',
            fontSize: 14,
        });

        const shapeElements = elements.filter(el =>
            !el.isDeleted && ['rectangle', 'ellipse', 'diamond', 'circle'].includes(el.type)
        );

        console.log(`Excalidraw shapes: ${shapeElements.length}`);
        console.log('Shape details:', shapeElements.map(s =>
            `id=${s.id} type=${s.type} x=${s.x?.toFixed(0)} y=${s.y?.toFixed(0)} w=${s.width?.toFixed(0)} h=${s.height?.toFixed(0)} text="${s.text || ''}"`
        ).join(' | '));

        // Build a mapping: mermaidId → {x, y, w, h}
        // Strategy: Try direct ID match first, then fallback to label matching
        const positionMap = new Map(); // mermaidId → {x, y, w, h}
        const labelToPos = new Map(); // label → {x, y, w, h}

        shapeElements.forEach(shape => {
            const label = shape.text || '';
            const x = shape.x + offsetX;
            const y = shape.y + offsetY;

            // Normalize to consistent size for uniform appearance
            const ICON_WIDTH = 50;
            const ICON_HEIGHT = 45;

            // Center the normalized icon on the original position
            const centeredX = x + (shape.width || ICON_WIDTH) / 2 - ICON_WIDTH / 2;
            const centeredY = y + (shape.height || ICON_HEIGHT) / 2 - ICON_HEIGHT / 2;

            // Try to find matching mermaid ID
            let matchedId = null;

            // Direct match: shape.id === mermaidId
            if (labelMap.has(shape.id)) {
                matchedId = shape.id;
            }

            // Strip prefix: "flowchart-A-1234" → "A"
            if (!matchedId) {
                const parts = shape.id.split('-');
                for (const part of parts) {
                    if (labelMap.has(part)) {
                        matchedId = part;
                        break;
                    }
                }
            }

            // Label-based match
            if (!matchedId && label) {
                for (const [mermaidId, mermaidLabel] of labelMap.entries()) {
                    if (mermaidLabel === label || mermaidLabel.toLowerCase() === label.toLowerCase()) {
                        matchedId = mermaidId;
                        break;
                    }
                }
            }

            if (matchedId) {
                positionMap.set(matchedId, { x: centeredX, y: centeredY, width: ICON_WIDTH, height: ICON_HEIGHT });
                console.log(`[Mapping] Excalidraw "${shape.id}" → Mermaid "${matchedId}" (${label}) at (${centeredX.toFixed(0)},${centeredY.toFixed(0)})`);
            } else {
                console.warn(`[Mapping] Could not match shape "${shape.id}" with label "${label}"`);
            }
        });

        console.log('Position map keys:', [...positionMap.keys()].join(', '));

        // Create node objects
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

        // Create edge objects using positionMap
        const connectorObjects = [];
        const seenEdges = new Set();

        edgeList.forEach(e => {
            const fromPos = positionMap.get(e.from);
            const toPos = positionMap.get(e.to);

            if (!fromPos) {
                console.warn(`[Edge] Missing position for source "${e.from}"`);
                return;
            }
            if (!toPos) {
                console.warn(`[Edge] Missing position for target "${e.to}"`);
                return;
            }

            const edgeKey = `${e.from}->${e.to}`;
            if (seenEdges.has(edgeKey)) return;
            seenEdges.add(edgeKey);

            // 3-segment elbow: source right → midpoint → target height → target left
            const GAP = 8;
            const sx = fromPos.x + fromPos.width + GAP;
            const sy = fromPos.y + fromPos.height / 2;
            const tx = toPos.x - GAP;
            const ty = toPos.y + toPos.height / 2;
            const midX = sx + (tx - sx) * 0.5;

            const points = [sx, sy, midX, sy, midX, ty, tx, ty];

            connectorObjects.push({
                id: `arrow-${e.from}_${e.to}`,
                type: 'arrow',
                x: 0, y: 0,
                points,
                stroke: '#475569',
                strokeWidth: 2.5,
            });

            console.log(`[Edge] ${e.from}→${e.to}: (${sx.toFixed(0)},${sy.toFixed(0)}) → (${tx.toFixed(0)},${ty.toFixed(0)})`);
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
