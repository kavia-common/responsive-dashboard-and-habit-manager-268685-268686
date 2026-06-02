import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {App} from '../App';

function seedAuth(token = 't-123', user = {email: 'a@example.com'}) {
    localStorage.setItem('habit_tracker_auth_v1', JSON.stringify({token, user}));
}

function mockFetchJsonOnce(expectedPath, payload) {
    global.fetch = jest.fn(async (url, options) => {
        // Keep assertions permissive: only require the URL to end with the expected path
        // so tests are not coupled to REACT_APP_API_BASE.
        if (typeof url === 'string' && !url.endsWith(expectedPath)) {
            return {
                ok: false,
                status: 404,
                headers: {get: () => 'application/json'},
                json: async () => ({message: 'Not Found'})
            };
        }

        // Minimal Response-like object to satisfy apiClient.js
        return {
            ok: true,
            status: 200,
            headers: {get: () => 'application/json'},
            json: async () => payload
        };
    });
}

describe('Auth routing + guards', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
        // Provide a deterministic API base so the API client forms a valid URL.
        process.env.REACT_APP_API_BASE = 'http://localhost';
    });

    test('unauthenticated users are redirected to /login when trying to access /app', async () => {
        window.history.pushState({}, '', '/app');

        render(<App />);

        // Login page has heading "Sign in"
        expect(await screen.findByRole('heading', {name: /sign in/i})).toBeInTheDocument();
        // Auth layout brand is visible.
        expect(screen.getAllByText('Habit Tracker')[0]).toBeInTheDocument();
    });

    test('after login, user is navigated back to originally requested protected route', async () => {
        const user = userEvent.setup();

        window.history.pushState({}, '', '/app/habits');

        mockFetchJsonOnce('/auth/login', {accessToken: 'tok-1', user: {email: 'tester@example.com'}});

        render(<App />);

        // Login form interaction
        expect(await screen.findByRole('heading', {name: /sign in/i})).toBeInTheDocument();
        await user.type(screen.getByLabelText(/email/i), 'tester@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(screen.getByRole('button', {name: /sign in/i}));

        // Should land on Habits page
        expect(await screen.findByRole('heading', {name: /habits/i})).toBeInTheDocument();

        // Sidebar navigation exists with accessible labeling.
        expect(screen.getByRole('navigation', {name: /primary/i})).toBeInTheDocument();

        // Guard sanity: authenticated shell shows logout.
        expect(screen.getByRole('button', {name: /log out/i})).toBeInTheDocument();

        // Ensure login call occurred.
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });

    test('already authenticated users can directly access /app pages', async () => {
        seedAuth('tok-2', {email: 'seeded@example.com'});
        window.history.pushState({}, '', '/app/export');

        render(<App />);

        expect(await screen.findByRole('heading', {name: /export \/ import/i})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /log out/i})).toBeInTheDocument();
    });
});
