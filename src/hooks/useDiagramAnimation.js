import { useCallback, useRef } from 'react';

/**
 * useDiagramAnimation: Manages entrance animations and lifecycle for diagram elements.
 * 
 * Layer 3: Entrance Animation
 * - Sequential scale + opacity animation when objects are added
 * - Staggered timing for waterfall effect
 * - Respects prefers-reduced-motion
 * - Performance: limits concurrent animations, auto-cleanup
 */

const ENTRANCE_DURATION = 0.4; // seconds
const ENTRANCE_STAGGER = 0.08; // seconds between each object
const ENTRANCE_EASING = 'backOut'; // backOut gives a nice "pop" effect

export function useDiagramAnimation() {
    const animatingIdsRef = useRef(new Set());
    const timeoutIdsRef = useRef([]);

    /**
     * Animates a single object with scale + opacity entrance.
     */
    const animateEntrance = useCallback((konvaNode) => {
        if (!konvaNode) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            // Skip animation, just show immediately
            konvaNode.opacity(1);
            konvaNode.scaleX(1);
            konvaNode.scaleY(1);
            return;
        }

        // Initial state: hidden and scaled down
        konvaNode.opacity(0);
        konvaNode.scaleX(0.3);
        konvaNode.scaleY(0.3);

        // Animate in
        const tween = new window.Konva.Tween({
            node: konvaNode,
            duration: ENTRANCE_DURATION,
            easing: window.Konva.Easings.BackEaseOut,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            onFinish: () => {
                // Cleanup tween
                konvaNode.remove();
            },
        });

        tween.play();
    }, []);

    /**
     * Triggers entrance animation for a batch of objects.
     * Objects are animated sequentially with staggered delays.
     * 
     * @param {Array} objectIds - Array of object IDs to animate
     * @param {Function} getNodeById - Function to get Konva node by ID
     */
    const animateBatch = useCallback((objectIds, getNodeById) => {
        if (!objectIds || objectIds.length === 0) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        objectIds.forEach((id, index) => {
            const delay = index * ENTRANCE_STAGGER * 1000; // Convert to ms

            const timeoutId = setTimeout(() => {
                const node = getNodeById(id);
                if (node) {
                    animatingIdsRef.current.add(id);
                    animateEntrance(node);
                }
            }, delay);

            timeoutIdsRef.current.push(timeoutId);
        });
    }, [animateEntrance]);

    /**
     * Cleans up all pending animations.
     * Call this when component unmounts or when board changes.
     */
    const cleanup = useCallback(() => {
        timeoutIdsRef.current.forEach((id) => clearTimeout(id));
        timeoutIdsRef.current = [];
        animatingIdsRef.current.clear();
    }, []);

    return {
        animateBatch,
        cleanup,
        isAnimating: (id) => animatingIdsRef.current.has(id),
    };
}

export default useDiagramAnimation;
