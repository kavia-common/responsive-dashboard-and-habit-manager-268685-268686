import React from 'react';
import {BrowserRouter} from 'react-router-dom';

import {AuthProvider} from './state/auth/AuthContext';
import {DataProvider} from './state/data/DataContext';
import {AppRoutes} from './routes/AppRoutes';

// PUBLIC_INTERFACE
export function App() {
    /** Root component that wires providers and the application router. */
    return (
        <BrowserRouter>
            <AuthProvider>
                <DataProvider>
                    <AppRoutes />
                </DataProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
