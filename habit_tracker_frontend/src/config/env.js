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
    const logLevel = process.env.REACT_APP_LOG_LEVEL || 'info';
    const featureFlagsRaw = process.env.REACT_APP_FEATURE_FLAGS || '';
    const experimentsEnabledRaw = process.env.REACT_APP_EXPERIMENTS_ENABLED || '';

    function parseBool(v) {
        if (typeof v !== 'string') {
            return false;
        }
        const s = v.trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'yes' || s === 'on';
    }

    function parseCsvFlags(v) {
        if (!v) {
            return [];
        }
        return v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }

    return {
        apiBase,
        wsUrl,
        frontendUrl,
        nodeEnv: process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || 'development',
        healthcheckPath: process.env.REACT_APP_HEALTHCHECK_PATH || '/healthz',
        logLevel,
        featureFlags: parseCsvFlags(featureFlagsRaw),
        experimentsEnabled: parseBool(experimentsEnabledRaw)
    };
}
