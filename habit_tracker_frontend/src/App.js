import React from 'react';
import {BrowserRouter} from 'react-router-dom';

import {AuthProvider} from './state/auth/AuthContext';
import {AppRoutes} from './routes/AppRoutes';

// PUBLIC_INTERFACE
export function App() {
    /** Root component that wires providers and the application router. */
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
