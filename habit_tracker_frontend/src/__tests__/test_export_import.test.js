import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {App} from '../App';

function seedAuth() {
    localStorage.setItem(
        'habit_tracker_auth_v1',
        JSON.stringify({token: 'tok', user: {email: 'seeded@example.com'}})
    );
}

describe('Export / Import critical flow', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
        seedAuth();
        window.history.pushState({}, '', '/app/export');
    });

    test('download export sets status and triggers a download click', async () => {
        const user = userEvent.setup();

        const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        render(<App />);

        expect(await screen.findByRole('heading', {name: /export \/ import/i})).toBeInTheDocument();

        await user.click(screen.getByRole('button', {name: /download json/i}));

        expect(await screen.findByText(/downloaded json export/i)).toBeInTheDocument();
        expect(clickSpy).toHaveBeenCalled();
    });

    test('copy export writes to clipboard and sets status', async () => {
        const user = userEvent.setup();
        render(<App />);

        expect(await screen.findByRole('heading', {name: /export \/ import/i})).toBeInTheDocument();

        await user.click(screen.getByRole('button', {name: /copy json/i}));

        expect(await screen.findByText(/copied export json to clipboard/i)).toBeInTheDocument();
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    test('import invalid JSON shows an error status; valid JSON shows success', async () => {
        const user = userEvent.setup();
        render(<App />);

        expect(await screen.findByRole('heading', {name: /export \/ import/i})).toBeInTheDocument();

        const textarea = screen.getByPlaceholderText(/habits/i);

        await user.type(textarea, '{not valid json}');
        await user.click(screen.getByRole('button', {name: /^import$/i}));

        expect(await screen.findByText(/invalid import payload/i)).toBeInTheDocument();

        // Now import a minimal valid dataset
        await user.clear(textarea);
        await user.type(
            textarea,
            JSON.stringify({
                habits: [{id: 'h1', name: 'Stretch', schedule: 'daily', goalPerPeriod: 1, goalUnit: 'times'}],
                checkins: [],
                reminders: [],
                settings: {timezone: 'UTC'}
            })
        );
        await user.click(screen.getByRole('button', {name: /^import$/i}));

        expect(await screen.findByText(/import complete/i)).toBeInTheDocument();
    });
});
