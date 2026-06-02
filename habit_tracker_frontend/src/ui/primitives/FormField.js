import React from 'react';

// PUBLIC_INTERFACE
export function FormField({label, hint, children}) {
    /** Consistent field wrapper for labels/hints and inputs. */
    return (
        <label className="field">
            <span className="fieldLabel">{label}</span>
            {children}
            {hint ? <span className="fieldHint">{hint}</span> : null}
        </label>
    );
}
