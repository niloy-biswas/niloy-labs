/**
 * Utility functions for DOM manipulation and helpers
 */

export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

export const createElement = (tag, className, text = '') => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
};

export const clearElement = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

export const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

export const setQueryParam = (key, value) => {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key);
  }
  window.history.pushState({}, '', url);
};
