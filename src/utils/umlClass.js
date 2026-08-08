/**
 * Geometry for UML class boxes.
 *
 * Kept free of React/Konva imports so layout code and tooling can size a box without pulling in
 * the canvas renderer.
 */

export const UML_HEADER = 32;
export const UML_ROW = 18;
export const UML_PAD = 8;
export const UML_MIN_WIDTH = 140;
export const UML_DEFAULT_WIDTH = 220;

export const toLines = (value) => (Array.isArray(value) ? value : []);

export const compartmentHeight = (lines) => Math.max(1, lines.length) * UML_ROW + UML_PAD * 2;

/** Total height of a class box, always derived from its contents. */
export function umlClassHeight(obj) {
    return (
        UML_HEADER +
        compartmentHeight(toLines(obj?.attributes)) +
        compartmentHeight(toLines(obj?.methods))
    );
}
