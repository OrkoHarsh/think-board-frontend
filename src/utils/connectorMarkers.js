/** Shared dash + UML marker geometry for board connectors */

export const MARKER_TYPES = ['none', 'arrow', 'openArrow', 'diamond', 'filledDiamond', 'triangle'];

export const LINE_STYLES = ['solid', 'dashed', 'dotted'];

export function getDashForLineStyle(lineStyle) {
    if (lineStyle === 'dashed') return [10, 6];
    if (lineStyle === 'dotted') return [2.5, 4];
    return undefined;
}

export function getMarkerSize(strokeWidth = 2) {
    return Math.max(10, strokeWidth * 4.5);
}

export function resolveMarkers(connectorProps) {
    const isArrow = connectorProps.type === 'arrow';
    return {
        startMarker: connectorProps.startMarker || 'none',
        endMarker: connectorProps.endMarker || (isArrow ? 'arrow' : 'none'),
        lineStyle: connectorProps.lineStyle || 'solid',
    };
}

/** Unit direction from (x1,y1) → (x2,y2) */
function unitDir(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    return { ux: dx / len, uy: dy / len };
}

/**
 * Inset polyline endpoints so the shaft doesn't draw through markers.
 * startMarker faces outward at first point; endMarker at last point.
 */
export function insetShaftPoints(points, startInset, endInset) {
    if (!points || points.length < 4) return points || [0, 0, 100, 100];
    const pts = [...points];
    const n = pts.length;

    if (startInset > 0) {
        const { ux, uy } = unitDir(pts[0], pts[1], pts[2], pts[3]);
        pts[0] += ux * startInset;
        pts[1] += uy * startInset;
    }
    if (endInset > 0) {
        const { ux, uy } = unitDir(pts[n - 4], pts[n - 3], pts[n - 2], pts[n - 1]);
        pts[n - 2] -= ux * endInset;
        pts[n - 1] -= uy * endInset;
    }
    return pts;
}

export function markerInset(markerType, size) {
    if (!markerType || markerType === 'none') return 0;
    if (markerType === 'openArrow') return size * 0.55;
    if (markerType === 'diamond' || markerType === 'filledDiamond') return size;
    return size * 0.85;
}

/**
 * Build Konva-friendly marker draw data.
 * tip at (tx, ty); (ux, uy) points in the direction the tip faces (along the line outward).
 */
export function buildMarkerGeometry(markerType, tipX, tipY, ux, uy, size) {
    if (!markerType || markerType === 'none') return null;

    const px = -uy;
    const py = ux;
    const half = size * 0.45;

    // Base of arrow sits behind the tip along -direction
    const baseX = tipX - ux * size;
    const baseY = tipY - uy * size;

    if (markerType === 'arrow') {
        return {
            kind: 'closed',
            points: [
                tipX, tipY,
                baseX + px * half, baseY + py * half,
                baseX - px * half, baseY - py * half,
            ],
            fill: true,
        };
    }

    if (markerType === 'openArrow') {
        return {
            kind: 'open',
            points: [
                baseX + px * half, baseY + py * half,
                tipX, tipY,
                baseX - px * half, baseY - py * half,
            ],
            fill: false,
        };
    }

    if (markerType === 'triangle') {
        // Hollow triangle (generalization) — tip at endpoint
        return {
            kind: 'closed',
            points: [
                tipX, tipY,
                baseX + px * half, baseY + py * half,
                baseX - px * half, baseY - py * half,
            ],
            fill: false,
        };
    }

    if (markerType === 'diamond' || markerType === 'filledDiamond') {
        const midX = tipX - ux * (size / 2);
        const midY = tipY - uy * (size / 2);
        const farX = tipX - ux * size;
        const farY = tipY - uy * size;
        const dw = size * 0.4;
        return {
            kind: 'closed',
            points: [
                tipX, tipY,
                midX + px * dw, midY + py * dw,
                farX, farY,
                midX - px * dw, midY - py * dw,
            ],
            fill: markerType === 'filledDiamond',
        };
    }

    return null;
}

/** Start tip faces away from the line (opposite first segment). End tip faces along last segment. */
export function getEndpointDirections(points) {
    const pts = points?.length >= 4 ? points : [0, 0, 100, 100];
    const n = pts.length;
    const start = unitDir(pts[2], pts[3], pts[0], pts[1]); // outward at start
    const end = unitDir(pts[n - 4], pts[n - 3], pts[n - 2], pts[n - 1]); // outward at end
    return {
        startTip: { x: pts[0], y: pts[1], ux: start.ux, uy: start.uy },
        endTip: { x: pts[n - 2], y: pts[n - 1], ux: end.ux, uy: end.uy },
    };
}
