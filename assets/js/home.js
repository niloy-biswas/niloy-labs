import { $, createElement, clearElement, getQueryParam, setQueryParam } from './utils.js';
import { createCard, createNavbar, createFooter, injectAnalytics, trackEvent } from './components.js';

// Analytics
injectAnalytics();

const DOM = {
    // We'll inject layout into body primarily
    grid: $('#experiment-grid'),
    featuredContainer: $('#featured-container'),
    filterChips: $('#filter-chips'),
    main: $('main')
};
// Inject Layout
document.body.prepend(createNavbar('.'));
document.body.append(createFooter());

let experiments = [];
let activeTag = getQueryParam('tag') || 'All';

async function init() {
    try {
        const response = await fetch('./data/experiments.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        // Filter active and sort by serial
        experiments = data
            .filter(exp => exp.status === 'active')
            .sort((a, b) => a.serial - b.serial);

        render();
    } catch (error) {
        console.error('Failed to load experiments.json:', error);
        DOM.grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <p class="text-muted">Unable to load experiments.</p>
        <p class="text-muted" style="font-size: 0.8em;">Note: If opening via file://, use a local server (python3 -m http.server).</p>
      </div>
    `;
    }
}

function render() {
    renderFilters();
    renderFeatured();
    renderGrid();
}

function renderFilters() {
    // Fixed categories as requested
    const categories = ['All', 'Data', 'AI', 'Creative'];

    clearElement(DOM.filterChips);

    categories.forEach(tag => {
        const chip = createElement('button', `chip ${tag === activeTag ? 'active' : ''}`, tag);
        chip.addEventListener('click', () => {
            activeTag = tag;
            setQueryParam('tag', tag === 'All' ? null : tag);
            render(); // Re-render everything to update UI
        });
        DOM.filterChips.appendChild(chip);
    });
}

function renderFeatured() {
    // Pick the experiment marked as "featured" in experiments.json
    const featured = experiments.find(ex => ex.featured) || experiments[0];

    // Requirement: Featured hero post should NOT be filtered. Always show it.
    if (!featured) {
        DOM.featuredContainer.style.display = 'none';
        return;
    }

    DOM.featuredContainer.style.display = 'block';

    // Inject content purely if available, otherwise fallback HTML is there
    const title = DOM.featuredContainer.querySelector('.hero-card-title');
    const desc = DOM.featuredContainer.querySelector('.hero-card-desc');
    const link = DOM.featuredContainer.querySelector('.btn-primary');
    const img = DOM.featuredContainer.querySelector('img');
    const tag = DOM.featuredContainer.querySelector('.serial-badge');

    if (title) title.textContent = featured.title;
    if (desc) desc.textContent = featured.one_liner;
    if (link) {
        link.href = `/${featured.slug}/`;
        link.addEventListener('click', () => trackEvent('experiment_click', { experiment_title: featured.title, source: 'hero' }));
    }
    if (img) img.src = featured.thumbnail;
    if (tag) tag.textContent = `No. ${String(featured.serial).padStart(3, '0')}`;
}

function renderGrid() {
    clearElement(DOM.grid);

    const filtered = activeTag === 'All'
        ? experiments
        : experiments.filter(ex => ex.tags.includes(activeTag));

    if (filtered.length === 0) {
        DOM.grid.innerHTML = '<p class="text-muted text-center" style="grid-column: 1/-1;">No experiments found with this tag.</p>';
        return;
    }

    filtered.forEach(exp => {
        const cardMap = createCard(exp);
        DOM.grid.appendChild(cardMap);
    });
}

// Start
init();
