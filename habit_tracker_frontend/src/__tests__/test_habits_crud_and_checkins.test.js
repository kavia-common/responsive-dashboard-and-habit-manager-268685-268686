import React from 'react';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {App} from '../App';

function seedAuth() {
    localStorage.setItem(
        'habit_tracker_auth_v1',
        JSON.stringify({token: 'tok', user: {email: 'seeded@example.com'}})
    );
}

describe('Habits CRUD modal + check-ins', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
        seedAuth();
        // Start at Habits page
        window.history.pushState({}, '', '/app/habits');
    });

    test('create habit via modal and close via Cancel and Escape (a11y basics)', async () => {
        const user = userEvent.setup();
        render(<App />);

        expect(await screen.findByRole('heading', {name: /habits/i})).toBeInTheDocument();

        await user.click(screen.getByRole('button', {name: /new habit/i}));

        // Modal uses role="dialog" and aria-label=title.
        const dialog = await screen.findByRole('dialog', {name: /new habit/i});
        expect(dialog).toBeInTheDocument();

        // Basic focus management: modal root should have focus after open.
        // (It is best-effort; this asserts our implementation intent.)
        expect(dialog).toHaveFocus();

        // Fill name and save
        await user.type(within(dialog).getByLabelText(/name/i), 'Read');
        await user.click(within(dialog).getByRole('button', {name: /save/i}));

        // Habit appears in table as a chip text.
        expect(await screen.findByText('Read')).toBeInTheDocument();

        // Re-open edit modal
        await user.click(screen.getByRole('button', {name: /edit/i}));
        const editDialog = await screen.findByRole('dialog', {name: /edit habit/i});
        expect(editDialog).toBeInTheDocument();

        // Close via Escape key (accessibility expectation)
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog', {name: /edit habit/i})).not.toBeInTheDocument();
    });

    test('quick check-in +1 updates today counter chip', async () => {
        const user = userEvent.setup();
        render(<App />);

        expect(await screen.findByRole('heading', {name: /habits/i})).toBeInTheDocument();

        // Create a habit first
        await user.click(screen.getByRole('button', {name: /new habit/i}));
        const dialog = await screen.findByRole('dialog', {name: /new habit/i});
        await user.type(within(dialog).getByLabelText(/name/i), 'Water');
        await user.click(within(dialog).getByRole('button', {name: /save/i}));

        // Find the row containing the habit name.
        const row = screen.getByText('Water').closest('tr');
        expect(row).toBeTruthy();

        // Initial counter shows 0/1 (default goalPerPeriod=1)
        expect(within(row).getByText('0/1')).toBeInTheDocument();

        // Click +1
        await user.click(within(row).getByRole('button', {name: '+1'}));

        // Now should show 1/1 (completion)
        expect(within(row).getByText('1/1')).toBeInTheDocument();

        // And the bar has an accessible label reflecting completion percentage
        expect(within(row).getByLabelText(/completion 100%/i)).toBeInTheDocument();
    });
});
