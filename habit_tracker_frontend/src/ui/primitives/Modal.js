import React, {useEffect} from 'react';

/**
 * Simple accessible modal:
 * - focus is moved to the dialog on open
 * - escape closes
 * - backdrop closes (optional)
 */

// PUBLIC_INTERFACE
export function Modal({title, isOpen, onClose, children, footer, closeOnBackdrop}) {
    /** Reusable modal dialog primitive. */
    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }
        function onKeyDown(e) {
            if (e.key === 'Escape') {
                onClose();
            }
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        // best-effort focus management
        const el = document.getElementById('app-modal-root');
        if (el) {
            el.focus();
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    function onBackdropClick() {
        if (closeOnBackdrop) {
            onClose();
        }
    }

    return (
        <div className="modalBackdrop" role="presentation" onMouseDown={onBackdropClick}>
            <div
                id="app-modal-root"
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="modalHeader">
                    <div className="modalTitle">{title}</div>
                    <button type="button" className="iconButton" onClick={onClose} aria-label="Close dialog">
                        ✕
                    </button>
                </div>
                <div className="modalBody">{children}</div>
                {footer ? <div className="modalFooter">{footer}</div> : null}
            </div>
        </div>
    );
}
