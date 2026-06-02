import React from 'react';
import {Navigate, useLocation} from 'react-router-dom';

import {useAuth} from '../state/auth/AuthContext';

// PUBLIC_INTERFACE
export function RequireAuth({children}) {
    /** Guards child routes; redirects to /login when unauthenticated. */
    const auth = useAuth();
    const location = useLocation();

    if (auth.status === 'loading') {
        return <div className="app-pageCenter">Loading…</div>;
    }

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" replace state={{from: location.pathname}} />;
    }

    return children;
}
