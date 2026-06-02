import React from 'react';

/**
 * Simple button primitive with variants.
 * Use for early scaffolding; can be replaced by a full component library later.
 */

// PUBLIC_INTERFACE
export function Button({children, onClick, type, disabled, variant}) {
    /** Reusable button primitive. */
    const btnType = type || 'button';
    const v = variant || 'primary';
    return (
        <button
            type={btnType}
            className={`btn btn--${v}`}
            onClick={onClick}
            disabled={Boolean(disabled)}
        >
            {children}
        </button>
    );
}
