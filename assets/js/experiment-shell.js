import { $, createElement } from './utils.js';
import { createNavbar, createFooter } from './components.js';

// Inject Layout
document.body.prepend(createNavbar('..'));
// Footer usually not needed on immersive experiments but we can add it if requested. 
// For now, only Navbar as per typical labs flow.


async function loadContent() {
    try {
        const response = await fetch('./content.json');
        if (!response.ok) throw new Error('Failed to load content');
        const data = await response.json();

        document.title = `${data.title} - Niloy Labs`;

        // Inject header info
        $('#exp-title').textContent = data.title;
        $('#exp-subtitle').textContent = data.subtitle;

        // Inject sections
        const infoContainer = $('#exp-info');
        if (infoContainer && data.sections) {
            // Clear existing content just in case
            while (infoContainer.firstChild) {
                infoContainer.removeChild(infoContainer.firstChild);
            }

            data.sections.forEach(section => {
                const secEl = createElement('div', 'info-section');
                const title = createElement('h3', 'info-title', section.heading);
                const para = createElement('p', 'info-text', section.body);
                secEl.append(title, para);
                infoContainer.appendChild(secEl);
            });
        }

    } catch (error) {
        console.error('Error loading experiment content:', error);
    }
}

// Initialize
loadContent();
