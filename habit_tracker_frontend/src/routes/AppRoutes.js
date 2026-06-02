import React from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';

import {AuthLayout} from '../ui/layouts/AuthLayout';
import {AppShellLayout} from '../ui/layouts/AppShellLayout';
import {RequireAuth} from './RequireAuth';

import {LoginPage} from '../views/auth/LoginPage';
import {RegisterPage} from '../views/auth/RegisterPage';
import {OnboardingPage} from '../views/auth/OnboardingPage';

import {DashboardPage} from '../views/app/DashboardPage';
import {HabitsPage} from '../views/app/HabitsPage';
import {CalendarPage} from '../views/app/CalendarPage';
import {RemindersPage} from '../views/app/RemindersPage';
import {AnalyticsPage} from '../views/app/AnalyticsPage';
import {SettingsPage} from '../views/app/SettingsPage';
import {ExportPage} from '../views/app/ExportPage';

// PUBLIC_INTERFACE
export function AppRoutes() {
    /** Defines the full routing table for the application. */
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />

            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>

            <Route
                path="/app"
                element={
                    <RequireAuth>
                        <AppShellLayout />
                    </RequireAuth>
                }
            >
                <Route index element={<DashboardPage />} />
                <Route path="habits" element={<HabitsPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="reminders" element={<RemindersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="export" element={<ExportPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
    );
}
