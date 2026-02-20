/**
 * Fetches an SVG icon file and returns it as a DOM element.
 * The SVG is fetched, parsed, and returned as an inline <svg> element
 * so that CSS properties like `currentColor` work correctly.
 *
 * @param {string} path - Path to the SVG file (e.g. './assets/icons/flask.svg')
 * @param {Object} [attrs] - Optional attributes to set on the <svg> element (e.g. { width: '20', height: '20', class: 'brand-icon' })
 * @returns {Promise<SVGSVGElement>} The parsed SVG element
 */
export async function loadIcon(path, attrs = {}) {
    const response = await fetch(path);
    const svgText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;

    // Apply any attribute overrides
    for (const [key, value] of Object.entries(attrs)) {
        svg.setAttribute(key, value);
    }

    return svg;
}
