# Niloy Labs

A collection of experimental web projects and demos.

## Development

This project uses vanilla HTML/CSS/JS. No build step is required.

**Important:** To view the site locally, you must use a local server because the code uses `fetch()` API calls to load JSON data. Browser security policies block `fetch()` on `file://` protocol.

### Running Locally

1.  Open your terminal.
2.  Navigate to the project root.
3.  Run a simple HTTP server:
    ```bash
    # Python 3
    python3 -m http.server
    
    # or with Node.js
    npx http-server
    ```
4.  Open `http://localhost:8000` in your browser.

## Adding a New Experiment

1.  **Create directory:** Create a new folder in the root with your experiment slug (e.g., `my-experiment`).
2.  **Create files:** Inside that folder, create:
    -   `index.html`: The experiment shell.
    -   `content.json`: Content for the experiment page.
    -   `app.js`: Your experiment logic.
3.  **Register:** Add a new entry to `data/experiments.json` with the experiment details (slug, title, status, etc.).

## Deployment

Pushed automatically to GitHub Pages.
