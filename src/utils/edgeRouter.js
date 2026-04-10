/**
 * Obstacle-Aware Edge Router
 *
 * Routes edges between nodes without crossing through other node bounding boxes.
 * Uses a 2-bend elbow routing strategy with collision detection.
 *
 * Strategy:
 * 1. Try direct 3-segment elbow (horizontal → vertical → horizontal)
 * 2. If collision, try alternate routes (4-bend, going above/below/around)
 * 3. If all fail, use the direct route (fallback — rare for well-laid-out graphs)
 */

// ============================================================================
// Bounding Box Utilities
// ============================================================================

/**
 * Check if a line segment intersects a rectangle (with padding).
 */
function segmentIntersectsRect(x1, y1, x2, y2, rect, padding = 0) {
    const rx = rect.x - padding;
    const ry = rect.y - padding;
    const rw = rect.width + padding * 2;
    const rh = rect.height + padding * 2;

    // Check if both endpoints are outside the rectangle
    const leftOf = Math.max(x1, x2) < rx;
    const rightOf = Math.min(x1, x2) > rx + rw;
    const above = Math.max(y1, y2) < ry;
    const below = Math.min(y1, y2) > ry + rh;

    if (leftOf || rightOf || above || below) return false;

    // Check intersection with each edge of the rectangle
    // Using Liang-Barsky or Cohen-Sutherland simplified
    // For elbow routes, we just check if the segment crosses the rect boundary
    return lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh);
}

function lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Check if line segment (x1,y1)-(x2,y2) intersects rectangle (rx,ry,rw,rh)
    const left = clipLine(x1, y1, x2, y2, rx, -Infinity, rx, Infinity);
    if (!left) return false;
    const right = clipLine(left.x1, left.y1, left.x2, left.y2, rx + rw, -Infinity, rx + rw, Infinity);
    if (!right) return false;
    const top = clipLine(right.x1, right.y1, right.x2, right.y2, -Infinity, ry, Infinity, ry);
    if (!top) return false;
    const bottom = clipLine(top.x1, top.y1, top.x2, top.y2, -Infinity, ry + rh, Infinity, ry + rh);
    return bottom !== null;
}

function clipLine(x1, y1, x2, y2, minX, minY, maxX, maxY) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    let t0 = 0, t1 = 1;

    const p = [-dx, dx, -dy, dy];
    const q = [x1 - minX, maxX - x1, y1 - minY, maxY - y1];

    for (let i = 0; i < 4; i++) {
        if (p[i] === 0) {
            if (q[i] < 0) return null;
        } else {
            const t = q[i] / p[i];
            if (p[i] < 0) {
                if (t > t1) return null;
                if (t > t0) t0 = t;
            } else {
                if (t < t0) return null;
                if (t < t1) t1 = t;
            }
        }
    }

    if (t0 > t1) return null;
    return {
        x1: x1 + t0 * dx,
        y1: y1 + t0 * dy,
        x2: x1 + t1 * dx,
        y2: y1 + t1 * dy,
    };
}

/**
 * Check if a polyline (array of [x, y] points) intersects any obstacle.
 */
function polylineIntersectsObstacles(points, obstacles, padding = 0) {
    for (let i = 0; i < points.length - 2; i += 2) {
        const x1 = points[i], y1 = points[i + 1];
        const x2 = points[i + 2], y2 = points[i + 3];
        for (const obs of obstacles) {
            if (segmentIntersectsRect(x1, y1, x2, y2, obs, padding)) return true;
        }
    }
    return false;
}

// ============================================================================
// Elbow Routing Strategies
// ============================================================================

/**
 * Strategy A: Standard 3-segment elbow
 *   ────┐
 *       │
 *   ────┘
 */
function routeElbow3(fromPos, toPos, direction) {
    const GAP = 6;
    if (direction === 'TB' || direction === 'BT') {
        const reverse = direction === 'BT';
        const sx = fromPos.x + fromPos.width / 2;
        const sy = reverse ? fromPos.y - GAP : fromPos.y + fromPos.height + GAP;
        const tx = toPos.x + toPos.width / 2;
        const ty = reverse ? toPos.y + toPos.height + GAP : toPos.y - GAP;
        const midY = sy + (ty - sy) / 2;
        return [sx, sy, sx, midY, tx, midY, tx, ty];
    } else {
        const reverse = direction === 'RL';
        const sx = reverse ? fromPos.x - GAP : fromPos.x + fromPos.width + GAP;
        const sy = fromPos.y + fromPos.height / 2;
        const tx = reverse ? toPos.x + toPos.width + GAP : toPos.x - GAP;
        const ty = toPos.y + toPos.height / 2;
        const midX = sx + (tx - sx) / 2;
        return [sx, sy, midX, sy, midX, ty, tx, ty];
    }
}

/**
 * Strategy B: 4-segment route going above obstacles
 *   ────┐     ┌────
 *       └─────
 */
function routeElbow4Above(fromPos, toPos, direction, obstacles) {
    const GAP = 6;
    const verticalOffset = 40; // Go above by this amount

    if (direction === 'TB' || direction === 'BT') {
        const sx = fromPos.x + fromPos.width / 2;
        const sy = fromPos.y + fromPos.height + GAP;
        const tx = toPos.x + toPos.width / 2;
        const ty = toPos.y - GAP;
        const midY = Math.min(sy, ty) - verticalOffset;
        return [sx, sy, sx, midY, tx, midY, tx, ty];
    } else {
        const sx = fromPos.x + fromPos.width + GAP;
        const sy = fromPos.y + fromPos.height / 2;
        const tx = toPos.x - GAP;
        const ty = toPos.y + toPos.height / 2;
        const topY = Math.min(sy, ty) - verticalOffset;
        return [sx, sy, sx, topY, tx, topY, tx, ty];
    }
}

/**
 * Strategy C: 4-segment route going below obstacles
 */
function routeElbow4Below(fromPos, toPos, direction) {
    const GAP = 6;
    const verticalOffset = 40;

    if (direction === 'TB' || direction === 'BT') {
        const sx = fromPos.x + fromPos.width / 2;
        const sy = fromPos.y + fromPos.height + GAP;
        const tx = toPos.x + toPos.width / 2;
        const ty = toPos.y - GAP;
        const botY = Math.max(sy, ty) + verticalOffset;
        return [sx, sy, sx, botY, tx, botY, tx, ty];
    } else {
        const sx = fromPos.x + fromPos.width + GAP;
        const sy = fromPos.y + fromPos.height / 2;
        const tx = toPos.x - GAP;
        const ty = toPos.y + toPos.height / 2;
        const botY = Math.max(sy, ty) + verticalOffset;
        return [sx, sy, sx, botY, tx, botY, tx, ty];
    }
}

/**
 * Strategy D: 5-segment "S" route for when both above and below are blocked
 *   ────┐
 *       │
 *   ────┘
 *   ────┐
 *       │
 *   ────┘
 */
function routeElbow5(fromPos, toPos, direction) {
    const GAP = 6;
    const offset = 50;

    if (direction === 'TB' || direction === 'BT') {
        const sx = fromPos.x + fromPos.width / 2;
        const sy = fromPos.y + fromPos.height + GAP;
        const tx = toPos.x + toPos.width / 2;
        const ty = toPos.y - GAP;
        const midX1 = sx + offset;
        const midX2 = tx - offset;
        const midY = (sy + ty) / 2;
        return [sx, sy, midX1, sy, midX1, midY, midX2, midY, midX2, ty, tx, ty];
    } else {
        const sx = fromPos.x + fromPos.width + GAP;
        const sy = fromPos.y + fromPos.height / 2;
        const tx = toPos.x - GAP;
        const ty = toPos.y + toPos.height / 2;
        const midY1 = sy + offset;
        const midY2 = ty - offset;
        const midX = (sx + tx) / 2;
        return [sx, sy, sx, midY1, midX, midY1, midX, midY2, tx, midY2, tx, ty];
    }
}

// ============================================================================
// Main Routing Function
// ============================================================================

/**
 * Route an edge from `fromPos` to `toPos` avoiding all `obstacles`.
 * Tries multiple strategies in order of preference.
 *
 * @param {Object} fromPos - {x, y, width, height} of source node
 * @param {Object} toPos - {x, y, width, height} of target node
 * @param {Array} obstacles - Array of {x, y, width, height} to avoid (excludes source/target)
 * @param {string} direction - 'LR', 'TB', 'RL', or 'BT'
 * @returns {Array} Flat array of [x1, y1, x2, y2, ...] points
 */
export function routeEdge(fromPos, toPos, obstacles, direction = 'LR') {
    // Filter out source and target from obstacles
    const relevantObstacles = obstacles.filter(obs => {
        return !(obs.x === fromPos.x && obs.y === fromPos.y &&
                 obs.width === fromPos.width && obs.height === fromPos.height) &&
               !(obs.x === toPos.x && obs.y === toPos.y &&
                 obs.width === toPos.width && obs.height === toPos.height);
    });

    const padding = 8; // Gap between edge and obstacle

    // Try each strategy in order
    const strategies = [
        () => routeElbow3(fromPos, toPos, direction),
        () => routeElbow4Above(fromPos, toPos, direction, relevantObstacles),
        () => routeElbow4Below(fromPos, toPos, direction),
        () => routeElbow5(fromPos, toPos, direction),
    ];

    for (const strategy of strategies) {
        const points = strategy();
        if (!polylineIntersectsObstacles(points, relevantObstacles, padding)) {
            return points;
        }
    }

    // Fallback: return the 3-segment route even if it intersects
    // (better than no edge at all)
    return routeElbow3(fromPos, toPos, direction);
}

/**
 * Route all edges for a set of nodes.
 *
 * @param {Map} nodePositions - Map of nodeId → {x, y, width, height}
 * @param {Array} edges - Array of {from, to}
 * @param {string} direction - Graph direction
 * @returns {Map} Map of edgeKey → {id, points}
 */
export function routeAllEdges(nodePositions, edges, direction = 'LR') {
    const obstacles = Array.from(nodePositions.entries()).map(([id, pos]) => ({
        ...pos,
        nodeId: id,
    }));

    const results = new Map();
    const seen = new Set();

    edges.forEach(e => {
        const fromPos = nodePositions.get(e.from);
        const toPos = nodePositions.get(e.to);
        if (!fromPos || !toPos) return;

        const key = `${e.from}->${e.to}`;
        if (seen.has(key)) return;
        seen.add(key);

        const points = routeEdge(fromPos, toPos, obstacles, direction);
        results.set(key, {
            id: `arrow-${e.from}_${e.to}`,
            points,
        });
    });

    return results;
}
