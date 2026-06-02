import React from 'react';
import {createRoot} from 'react-dom/client';

import {App} from './App';
import './styles/global.css';

// PUBLIC_INTERFACE
function renderApp() {
    /** Renders the React application into the root DOM node. */
    const rootEl = document.getElementById('root');
    if (!rootEl) {
        throw new Error('Root element #root not found.');
    }
    const root = createRoot(rootEl);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

renderApp();
