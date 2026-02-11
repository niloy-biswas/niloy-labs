/**
 * Word Portrait Experiment Logic
 * Placeholder for demo purposes
 */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const generateBtn = document.getElementById('generate-btn');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 400; // Fixed height for demo
}

function drawDemo() {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#212529';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText('Word Portrait Demo Canvas', canvas.width / 2, canvas.height / 2);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#6c757d';
    ctx.fillText('(Interactive logic placeholder)', canvas.width / 2, canvas.height / 2 + 30);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    drawDemo();
});

generateBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fake generation animation
    ctx.fillStyle = '#e9ecef';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0d6efd';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Generating...', canvas.width / 2, canvas.height / 2);

    setTimeout(() => {
        resizeCanvas();
        drawDemo();
        alert('This is a placeholder for the actual generation logic!');
    }, 1000);
});

// Init
resizeCanvas();
drawDemo();
