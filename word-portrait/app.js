import { createNavbar, createFooter, injectAnalytics, trackEvent } from '../assets/js/components.js';

// Analytics
injectAnalytics();

// Inject Layout
document.body.prepend(createNavbar('..', 'experiment'));

// --- Core Logic ---
const textLayer = document.getElementById('textLayer');
const textInput = document.getElementById('textInput');
const root = document.documentElement;

let originalImageSrc = null;
let currentImageElement = new Image();
currentImageElement.crossOrigin = "anonymous";

let selfieSegmentation = null;
let currentMask = null;

// ==========================================
// CONFIGURATION
// ==========================================
const USER_IMAGE_URL = ""; // Fallback or empty if exclusively driven by content.json
// ==========================================

function updateTextDisplay() {
    // If input empty, use placeholder logic or handle empty
    const rawText = textInput.value || textInput.placeholder;
    if (!rawText) return;

    const cleanText = rawText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    // Cap repetition to avoid 2.5m chars if text is long. 
    // Target length ~100k chars is usually enough for HD.
    const targetLength = 100000;
    const repeats = Math.ceil(targetLength / cleanText.length);
    const repeatedText = cleanText.repeat(repeats);

    textLayer.innerText = repeatedText;
}

async function initMediaPipe() {
    if (selfieSegmentation) return;
    selfieSegmentation = new SelfieSegmentation({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}` });
    selfieSegmentation.setOptions({ modelSelection: 1, selfieMode: false });
    selfieSegmentation.onResults(onMediaPipeResults);
}

function onMediaPipeResults(results) {
    currentMask = results.segmentationMask;

    const dimmerGroup = document.getElementById('bgDimmerGroup');
    dimmerGroup.classList.remove('opacity-50', 'pointer-events-none');

    document.getElementById('detectText').innerText = "Detection Active";
    document.getElementById('detectLoader').classList.add('hidden');
    document.getElementById('resetBtn').classList.remove('hidden');

    updateCompositeImage();
}

function updateCompositeImage() {
    if (!currentMask || !currentImageElement.src) return;
    const dimness = parseFloat(document.getElementById('bgDimmer').value);
    const canvas = document.createElement('canvas');
    canvas.width = currentImageElement.naturalWidth;
    canvas.height = currentImageElement.naturalHeight;
    const ctx = canvas.getContext('2d');

    try {
        ctx.drawImage(currentImageElement, 0, 0);

        const overlay = document.createElement('canvas');
        overlay.width = canvas.width; overlay.height = canvas.height;
        const oCtx = overlay.getContext('2d');
        oCtx.fillStyle = `rgba(0, 0, 0, ${dimness})`;
        oCtx.fillRect(0, 0, overlay.width, overlay.height);
        oCtx.globalCompositeOperation = 'destination-out';
        oCtx.drawImage(currentMask, 0, 0, overlay.width, overlay.height);

        ctx.drawImage(overlay, 0, 0);
        root.style.setProperty('--bg-image', `url(${canvas.toDataURL()})`);
    } catch (e) {
        console.warn("CORS restriction prevented canvas update.");
    }
}

// --- DOWNLOAD LOGIC ---

document.getElementById('downloadBtn').addEventListener('click', async () => {
    const btn = document.getElementById('downloadBtn');
    const status = document.getElementById('downloadStatus');

    // Check if the image has been processed (converted to data URL by MediaPipe)
    const bgUrl = getComputedStyle(root).getPropertyValue('--bg-image').trim();

    if (!bgUrl || !bgUrl.includes('data:image')) {
        status.innerText = "⚠ Please run 'Detect Person & Darken' first.";
        setTimeout(() => status.innerText = "", 4000);
        return;
    }

    await attemptDownload(btn, status);
});

async function attemptDownload(btn, status) {
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div> Rendering...`;
    status.innerText = "";

    // Let the UI update before heavy work
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
        const container = document.getElementById('exportContainer');
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        const scale = 2;

        // --- Read ALL styles from the RENDERED textLayer element ---
        const cs = getComputedStyle(textLayer);
        const fontSizePx = parseFloat(cs.fontSize);                        // actual px
        const lineHeightPx = parseFloat(cs.lineHeight) || fontSizePx * 0.65; // actual px
        const fontWeight = cs.fontWeight;                                  // e.g. "700"
        const letterSpacing = parseFloat(cs.letterSpacing) || 0;           // actual px
        const fontFamily = cs.fontFamily;
        const fontSize = fontSizePx + 'px';
        // Read the filter directly from the rendered element (includes grayscale, contrast, brightness)
        const cssFilter = cs.filter && cs.filter !== 'none'
            ? cs.filter
            : 'grayscale(1) contrast(1.2) brightness(1.1)';

        // --- STEP 1: Create a TEXT MASK on a separate canvas ---
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width * scale;
        maskCanvas.height = height * scale;
        const maskCtx = maskCanvas.getContext('2d');
        maskCtx.scale(scale, scale);
        maskCtx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
        maskCtx.fillStyle = 'white';
        maskCtx.textBaseline = 'top';

        const rawText = (textInput.value || 'text portrait').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

        // Mimic CSS: word-break: break-all + text-align: justify
        // CSS justify adds extra space at WORD boundaries (space chars), not between every char.
        let textIdx = 0;
        let y = 0;
        while (y < height) {
            // First pass: figure out how many chars fit in this line at natural spacing
            let charsFit = 0;
            let naturalWidth = 0;
            while (naturalWidth < width) {
                const char = rawText[(textIdx + charsFit) % rawText.length];
                const cw = maskCtx.measureText(char).width + letterSpacing;
                if (naturalWidth + cw > width && charsFit > 0) break;
                naturalWidth += cw;
                charsFit++;
            }

            // Collect characters and measure their natural widths
            let totalNaturalWidth = 0;
            const lineChars = [];
            const charWidths = [];
            let spaceCount = 0;
            for (let i = 0; i < charsFit; i++) {
                const c = rawText[(textIdx + i) % rawText.length];
                const w = maskCtx.measureText(c).width + letterSpacing;
                lineChars.push(c);
                charWidths.push(w);
                totalNaturalWidth += w;
                if (c === ' ') spaceCount++;
            }
            textIdx += charsFit;

            // Justify: distribute remaining space ONLY among space characters
            const remainingSpace = width - totalNaturalWidth;
            const extraPerSpace = spaceCount > 0 ? remainingSpace / spaceCount : 0;

            let x = 0;
            for (let i = 0; i < lineChars.length; i++) {
                maskCtx.fillText(lineChars[i], x, y);
                x += charWidths[i];
                // Add extra justify space only after space characters
                if (lineChars[i] === ' ') x += extraPerSpace;
            }

            y += lineHeightPx;
        }

        // --- STEP 2: Load the processed image ---
        let bgUrl = getComputedStyle(root).getPropertyValue('--bg-image').trim();
        bgUrl = bgUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

        const img = new Image();
        img.src = bgUrl;
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error("Failed to load image for export."));
        });

        // --- STEP 3: Draw filtered image on the MAIN canvas ---
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        // Apply the EXACT same CSS filter from the rendered element
        ctx.filter = cssFilter;

        // Cover mode calculation
        const iRatio = img.width / img.height;
        const cRatio = width / height;
        let sx, sy, sWidth, sHeight;
        if (cRatio > iRatio) {
            sWidth = img.width;
            sHeight = img.width / cRatio;
            sx = 0;
            sy = (img.height - sHeight) / 2;
        } else {
            sWidth = img.height * cRatio;
            sHeight = img.height;
            sx = (img.width - sWidth) / 2;
            sy = 0;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);

        // --- STEP 4: Apply the text mask via compositing ---
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(maskCanvas, 0, 0);

        // --- STEP 5: Add black background behind (transparent → black) ---
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width * scale;
        finalCanvas.height = height * scale;
        const fCtx = finalCanvas.getContext('2d');
        fCtx.fillStyle = '#000000';
        fCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        fCtx.drawImage(canvas, 0, 0);

        // --- STEP 6: Trigger Download ---
        const link = document.createElement('a');
        link.download = 'text-portrait.png';
        link.href = finalCanvas.toDataURL('image/png');
        link.click();

        btn.innerHTML = originalText;
        btn.disabled = false;
        status.innerText = "✓ Saved!";
        trackEvent('portrait_downloaded');

    } catch (err) {
        console.error('Download error:', err);
        btn.innerHTML = originalText;
        btn.disabled = false;
        status.innerText = "Error: " + err.message;
        setTimeout(() => status.innerText = "", 5000);
    }
}

// --- EVENTS ---

const imageInput = document.getElementById('imageInput');

imageInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
        trackEvent('image_uploaded');
        const reader = new FileReader();
        reader.onload = evt => {
            originalImageSrc = evt.target.result;
            currentImageElement.src = originalImageSrc;
            root.style.setProperty('--bg-image', `url(${originalImageSrc})`);

            currentMask = null;
            document.getElementById('resetBtn').classList.add('hidden');
            document.getElementById('bgDimmerGroup').classList.add('opacity-50', 'pointer-events-none');
            document.getElementById('detectText').innerText = "Detect Person & Darken";
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('detectBtn').addEventListener('click', async () => {
    if (!currentImageElement.src) return;
    document.getElementById('detectLoader').classList.remove('hidden');
    document.getElementById('detectText').innerText = "Detecting...";

    try {
        await initMediaPipe();
        await selfieSegmentation.send({ image: currentImageElement });
    } catch (err) {
        console.error("Detection Error:", err);
        document.getElementById('detectLoader').classList.add('hidden');
        document.getElementById('detectText').innerText = "Detection Failed";
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    currentMask = null;
    root.style.setProperty('--bg-image', `url(${originalImageSrc})`);
    document.getElementById('resetBtn').classList.add('hidden');
    document.getElementById('bgDimmerGroup').classList.add('opacity-50', 'pointer-events-none');
    document.getElementById('detectText').innerText = "Detect Person & Darken";
});

const config = [
    { id: 'fontSize', var: '--font-size', unit: 'px' },
    { id: 'letterSpacing', var: '--letter-spacing', unit: 'px' },
    { id: 'bgDimmer', update: updateCompositeImage }
];

config.forEach(c => {
    const el = document.getElementById(c.id);
    el.addEventListener('input', e => {
        if (c.var) root.style.setProperty(c.var, e.target.value + c.unit);
        if (document.getElementById(c.id + 'Val')) {
            const val = c.id === 'bgDimmer' ? Math.round(e.target.value * 100) + '%' : e.target.value + (c.unit || '');
            document.getElementById(c.id + 'Val').innerText = val;
        }
        if (c.update) c.update();
    });
});

document.getElementById('fontFamily').addEventListener('change', e => textLayer.style.fontFamily = e.target.value);
document.getElementById('fontWeight').addEventListener('change', e => root.style.setProperty('--font-weight', e.target.value));
document.getElementById('updateTextBtn').addEventListener('click', updateTextDisplay);

// --- AUTO INITIALIZATION ON LOAD ---
window.addEventListener('load', async () => {
    try {
        // Fetch external content
        const response = await fetch('./content.json');
        const content = await response.json();

        // Populate specific elements
        if (content.default_text) {
            textInput.value = content.default_text;
        }

        const directUrl = content.default_image_url || USER_IMAGE_URL;

        root.style.setProperty('--bg-image', `url(${directUrl})`);

        currentImageElement.src = directUrl;
        originalImageSrc = directUrl;

        updateTextDisplay();

        currentImageElement.onload = async () => {
            console.log("Image loaded. Starting Auto-Detect...");
            try {
                document.getElementById('detectLoader').classList.remove('hidden');
                document.getElementById('detectText').innerText = "Auto-Detecting...";

                await initMediaPipe();
                await selfieSegmentation.send({ image: currentImageElement });
            } catch (err) {
                console.error("Auto-detect failed:", err);
                // Fail silently or show UI error, but allow manual retry
                document.getElementById('detectLoader').classList.add('hidden');
                document.getElementById('detectText').innerText = "Detection Failed";
            }
        };

        currentImageElement.onerror = () => {
            console.error("Failed to load image from URL");
            document.getElementById('detectLoader').classList.add('hidden');
            document.getElementById('detectText').innerText = "Load Failed";
        };

    } catch (e) {
        console.error("Failed to load content.json. Ensure the file exists and is being served.", e);
    }
});
