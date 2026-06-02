import React from 'react';
import {Outlet} from 'react-router-dom';

// PUBLIC_INTERFACE
export function AuthLayout() {
    /** Layout for unauthenticated pages (login/register/onboarding). */
    return (
        <div className="authLayout">
            <div className="authCard">
                <div className="authBrand">
                    <div className="authLogo" aria-hidden="true">H</div>
                    <div>
                        <div className="authTitle">Habit Tracker</div>
                        <div className="authSubtitle">Build consistency with a simple daily system.</div>
                    </div>
                </div>
                <Outlet />
            </div>
        </div>
    );
}
