/**
 * Mermaid Preprocessor
 *
 * Cleans and restructures AI-generated Mermaid graphs for optimal diagram rendering.
 *
 * Pipeline:
 * 1. Strip unrenderable content (notes, comments, style blocks)
 * 2. Deduplicate edges
 * 3. Detect architectural patterns (cross-cutting concerns, fan-out hubs)
 * 4. Assign layer hints for layout engine
 * 5. Reorder edges for visual clarity
 */

// ============================================================================
// Layer Heuristics: keyword → layer assignment
// ============================================================================
const LAYER_HINTS = {
    'client': { layer: 0, group: 'entry' },
    'user': { layer: 0, group: 'entry' },
    'mobile': { layer: 0, group: 'entry' },
    'browser': { layer: 0, group: 'entry' },
    'frontend': { layer: 0, group: 'entry' },
    'web': { layer: 0, group: 'entry' },

    'load balancer': { layer: 1, group: 'edge' },
    'loadbalancer': { layer: 1, group: 'edge' },
    'nginx': { layer: 1, group: 'edge' },
    'proxy': { layer: 1, group: 'edge' },
    'gateway': { layer: 1, group: 'edge' },
    'api gateway': { layer: 1, group: 'edge' },
    'ingress': { layer: 1, group: 'edge' },
    'cdn': { layer: 1, group: 'edge' },

    'server': { layer: 2, group: 'compute' },
    'service': { layer: 2, group: 'compute' },
    'application': { layer: 2, group: 'compute' },
    'microservice': { layer: 2, group: 'compute' },
    'api': { layer: 2, group: 'compute' },
    'auth': { layer: 2, group: 'compute' },
    'generator': { layer: 2, group: 'compute' },
    'redirect': { layer: 2, group: 'compute' },
    'processor': { layer: 2, group: 'compute' },
    'handler': { layer: 2, group: 'compute' },
    'controller': { layer: 2, group: 'compute' },
    'dashboard': { layer: 2, group: 'compute' },
    'admin': { layer: 2, group: 'compute' },
    'management': { layer: 2, group: 'compute' },
    'configuration': { layer: 2, group: 'compute' },

    'database': { layer: 3, group: 'storage' },
    'db': { layer: 3, group: 'storage' },
    'postgres': { layer: 3, group: 'storage' },
    'mysql': { layer: 3, group: 'storage' },
    'mongo': { layer: 3, group: 'storage' },
    'cache': { layer: 3, group: 'storage' },
    'redis': { layer: 3, group: 'storage' },
    'storage': { layer: 3, group: 'storage' },
    'queue': { layer: 3, group: 'storage' },
    'kafka': { layer: 3, group: 'storage' },
    'rabbit': { layer: 3, group: 'storage' },
    'elasticsearch': { layer: 3, group: 'storage' },
    'hash generator': { layer: 3, group: 'storage' },

    'monitoring': { layer: 4, group: 'observability' },
    'monitor': { layer: 4, group: 'observability' },
    'logging': { layer: 4, group: 'observability' },
    'analytics': { layer: 4, group: 'observability' },
    'grafana': { layer: 4, group: 'observability' },
    'prometheus': { layer: 4, group: 'observability' },
    'alert': { layer: 4, group: 'observability' },
    'metrics': { layer: 4, group: 'observability' },
    'tracing': { layer: 4, group: 'observability' },
};

const GROUP_NAMES = {
    'entry': 'Entry Layer',
    'edge': 'Edge / Gateway Layer',
    'compute': 'Application Layer',
    'storage': 'Data Layer',
    'observability': 'Observability Layer',
};

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse raw Mermaid string into structured data.
 */
function parseMermaid(raw) {
    const clean = raw
        .replace(/```mermaid/g, '')
        .replace(/```/g, '')
        .trim();

    // Detect direction
    const firstLine = clean.split('\n')[0]?.trim() || '';
    let direction = 'LR';
    if (/graph\s+(TD|TB)/i.test(firstLine)) direction = 'TB';
    else if (/graph\s+RL/i.test(firstLine)) direction = 'RL';
    else if (/graph\s+BT/i.test(firstLine)) direction = 'BT';

    // Extract nodes and edges, skip non-graph lines
    const labels = new Map();
    const edges = [];

    clean.split('\n').forEach(line => {
        line = line.trim();
        if (!line || /^graph\s/i.test(line) || /^subgraph/i.test(line) ||
            line === 'end' || line.startsWith('%%') ||
            line.startsWith('style ') || line.startsWith('classDef ') ||
            line.startsWith('Note') || line.startsWith('- ')) return;

        // Extract node definitions: A[Label]
        const nodeRegex = /(\w+)\[["']?([^\]"']+?)["']?\]/g;
        let match;
        while ((match = nodeRegex.exec(line)) !== null) {
            labels.set(match[1], match[2].trim());
        }

        // Extract edges: A --> B
        const edgeRegex = /(\w+)(?:\[.*?\])?\s*(?:-[-.]*>+)\s*(\w+)(?:\[.*?\])?/g;
        while ((match = edgeRegex.exec(line)) !== null) {
            const from = match[1], to = match[2];
            if (from && to && from !== to) {
                edges.push({ from, to });
            }
        }
    });

    return { direction, labels, edges };
}

// ============================================================================
// Step 1: Strip & Clean
// ============================================================================

function stripNoise(raw) {
    // Already handled in parseMermaid by skipping non-graph lines
    return raw;
}

// ============================================================================
// Step 2: Deduplicate Edges
// ============================================================================

function deduplicateEdges(edges) {
    const seen = new Set();
    return edges.filter(e => {
        const key = `${e.from}->${e.to}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ============================================================================
// Step 3: Detect Patterns
// ============================================================================

/**
 * Detect cross-cutting concerns: nodes that connect to >50% of all other nodes.
 * These are typically monitoring, logging, or infrastructure nodes.
 */
function detectCrossCutting(nodes, edges) {
    const threshold = 0.5;
    const crossCutting = new Set();
    const connectionCount = new Map();

    nodes.forEach(id => connectionCount.set(id, 0));
    edges.forEach(e => {
        connectionCount.set(e.from, (connectionCount.get(e.from) || 0) + 1);
        connectionCount.set(e.to, (connectionCount.get(e.to) || 0) + 1);
    });

    const maxConnections = nodes.length * 0.6; // Connect to majority
    nodes.forEach(id => {
        if (connectionCount.get(id) >= maxConnections && maxConnections > 2) {
            crossCutting.add(id);
        }
    });

    return crossCutting;
}

/**
 * Detect hub nodes: nodes with high fan-out (>3 outgoing edges).
 * These are typically load balancers, API gateways, etc.
 */
function detectHubs(edges) {
    const fanOut = new Map();
    edges.forEach(e => fanOut.set(e.from, (fanOut.get(e.from) || 0) + 1));
    const hubs = new Set();
    fanOut.forEach((count, id) => {
        if (count >= 3) hubs.add(id);
    });
    return hubs;
}

// ============================================================================
// Step 4: Assign Layer Hints
// ============================================================================

function assignLayerHints(labels) {
    const hints = new Map();

    labels.forEach((label, id) => {
        const lower = label.toLowerCase();
        let bestHint = { layer: 2, group: 'compute' }; // Default
        let bestPriority = 0;

        for (const [keyword, hint] of Object.entries(LAYER_HINTS)) {
            if (lower.includes(keyword) && keyword.length > bestPriority) {
                bestHint = hint;
                bestPriority = keyword.length;
            }
        }

        hints.set(id, bestHint);
    });

    return hints;
}

// ============================================================================
// Step 5: Reorder Edges for Clarity
// ============================================================================

/**
 * Reorder edges so that:
 * 1. Hub-to-hub edges come first (main data flow)
 * 2. Hub-to-leaf edges come next
 * 3. Leaf-to-leaf edges come last
 * 4. Cross-cutting edges are placed at the end
 */
function reorderEdges(edges, hubs, crossCutting) {
    return [...edges].sort((a, b) => {
        const aIsHub = hubs.has(a.from) && hubs.has(a.to);
        const bIsHub = hubs.has(b.from) && hubs.has(b.to);
        if (aIsHub && !bIsHub) return -1;
        if (!aIsHub && bIsHub) return 1;

        const aIsCrossCut = crossCutting.has(a.from) || crossCutting.has(a.to);
        const bIsCrossCut = crossCutting.has(b.from) || crossCutting.has(b.to);
        if (!aIsCrossCut && bIsCrossCut) return -1;
        if (aIsCrossCut && !bIsCrossCut) return 1;

        return 0;
    });
}

// ============================================================================
// Step 6: Reconstruct Mermaid with Subgraphs
// ============================================================================

function reconstructMermaid(direction, labels, edges, hints) {
    // Keep it simple — just output clean edges without subgraphs
    // Subgraphs complicate parsing and layout
    let mermaid = `graph ${direction}\n`;
    edges.forEach(e => {
        mermaid += `    ${e.from}[${labels.get(e.from)}] --> ${e.to}[${labels.get(e.to)}]\n`;
    });
    return mermaid;
}

// ============================================================================
// Main Preprocess Pipeline
// ============================================================================

/**
 * Preprocess a raw Mermaid string from the AI API.
 * Returns a cleaned, restructured Mermaid string optimized for layout.
 */
export function preprocessMermaid(rawMermaid) {
    console.log('[Preprocessor] Input:', rawMermaid.substring(0, 100) + '...');

    // Step 1: Parse
    const { direction, labels, edges: rawEdges } = parseMermaid(rawMermaid);
    console.log(`[Preprocessor] Parsed: ${labels.size} nodes, ${rawEdges.length} edges, direction=${direction}`);

    if (labels.size === 0) {
        console.warn('[Preprocessor] No nodes found, returning original');
        return rawMermaid;
    }

    // Step 2: Deduplicate edges
    const edges = deduplicateEdges(rawEdges);
    console.log(`[Preprocessor] After dedup: ${edges.length} edges (removed ${rawEdges.length - edges.length} duplicates)`);

    // Step 3: Detect patterns
    const nodeIds = Array.from(labels.keys());
    const crossCutting = detectCrossCutting(nodeIds, edges);
    const hubs = detectHubs(edges);
    console.log('[Preprocessor] Cross-cutting:', [...crossCutting].map(id => labels.get(id)));
    console.log('[Preprocessor] Hubs:', [...hubs].map(id => labels.get(id)));

    // Step 4: Assign layer hints
    const hints = assignLayerHints(labels);
    console.log('[Preprocessor] Layer hints:', Object.fromEntries(hints));

    // Step 5: Reorder edges
    const orderedEdges = reorderEdges(edges, hubs, crossCutting);

    // Step 6: Reconstruct with subgraphs
    const result = reconstructMermaid(direction, labels, orderedEdges, hints);
    console.log('[Preprocessor] Output:', result.substring(0, 100) + '...');

    return result;
}
