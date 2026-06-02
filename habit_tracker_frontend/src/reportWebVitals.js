// PUBLIC_INTERFACE
export function reportWebVitals(onPerfEntry) {
    /** CRA web-vitals hook; left as a placeholder. */
    if (onPerfEntry && onPerfEntry instanceof Function) {
        // Lazy import to avoid overhead when unused.
        import('web-vitals').then(({getCLS, getFID, getFCP, getLCP, getTTFB}) => {
            getCLS(onPerfEntry);
            getFID(onPerfEntry);
            getFCP(onPerfEntry);
            getLCP(onPerfEntry);
            getTTFB(onPerfEntry);
        });
    }
}
