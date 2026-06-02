/**
 * Centralized environment variable access for the frontend.
 * CRA only exposes variables prefixed with REACT_APP_.
 */

/* eslint-disable no-process-env */

// PUBLIC_INTERFACE
export function getEnv() {
    /** Returns normalized environment config derived from REACT_APP_* variables. */
    const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';
    const wsUrl = process.env.REACT_APP_WS_URL || '';
    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || '';

    return {
        apiBase,
        wsUrl,
        frontendUrl,
        nodeEnv: process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || 'development',
        healthcheckPath: process.env.REACT_APP_HEALTHCHECK_PATH || '/healthz'
    };
}
