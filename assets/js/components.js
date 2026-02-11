import { createElement } from './utils.js';

/**
 * Generates the standard Navbar
 * @param {string} rootPath - specific path to root (e.g. "." or "..")
 */
export function createNavbar(rootPath = '.') {
    const header = createElement('header', 'navbar');
    const pill = createElement('div', 'navbar-pill');

    const group = createElement('span', 'brand-group');

    const linkNiloy = createElement('a', 'brand-link', 'Niloy');
    linkNiloy.href = 'https://niloy.tech';

    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('class', 'brand-icon');
    iconSvg.setAttribute('width', '20');
    iconSvg.setAttribute('height', '20');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('stroke', 'currentColor');
    iconSvg.setAttribute('stroke-width', '2');
    iconSvg.setAttribute('stroke-linecap', 'round');
    iconSvg.setAttribute('stroke-linejoin', 'round');
    iconSvg.innerHTML = `
    <path d="M10 2v7.31"></path>
    <path d="M14 9.3V1.99"></path>
    <path d="M8.5 2h7"></path>
    <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
  `;

    const linkLabs = createElement('a', 'brand-link', 'Labs');
    linkLabs.href = `${rootPath}/`;

    group.append(linkNiloy, iconSvg, linkLabs);
    pill.appendChild(group);
    header.appendChild(pill);

    return header;
}

/**
 * Generates the standard Footer
 */
export function createFooter() {
    const footer = createElement('footer', 'container');
    footer.style.padding = '2rem 1rem';
    footer.style.marginTop = 'auto';
    footer.style.borderTop = '1px solid var(--color-border)';

    const div = createElement('div', 'text-center');

    const p = createElement('p', 'text-muted text-sm', '© Niloy Biswas');
    p.style.marginBottom = '0.5rem';

    const link = createElement('a', 'text-sm', '← Return to niloy.tech');
    link.href = 'https://niloy.tech';
    link.style.color = 'var(--color-text-muted)';
    link.style.textDecoration = 'none';
    link.style.opacity = '0.7';

    div.append(p, link);
    footer.appendChild(div);

    return footer;
}

/**
 * Generates an experiment card
 * @param {Object} exp - Experiment data object
 */
export function createCard(exp) {
    const article = createElement('article', 'card');

    const link = createElement('a', 'card-link');
    // If slug starts with http, it is external, otherwise internal relative
    link.href = exp.slug.startsWith('http') ? exp.slug : `/${exp.slug}/`;

    const thumb = createElement('div', 'card-thumb');
    const img = createElement('img');
    img.src = exp.thumbnail;
    img.alt = exp.title;
    img.loading = 'lazy';
    thumb.appendChild(img);

    const content = createElement('div', 'card-content');

    const header = createElement('div', 'card-header');
    const badge = createElement('span', 'serial-badge', `No. ${String(exp.serial).padStart(3, '0')}`);
    const title = createElement('h3', 'card-title', exp.title);
    header.append(badge, title);

    const desc = createElement('p', 'card-desc', exp.one_liner);

    const cta = createElement('span', 'card-cta', 'View Experiment');

    content.append(header, desc, cta);
    link.append(thumb, content);
    article.appendChild(link);

    return article;
}
