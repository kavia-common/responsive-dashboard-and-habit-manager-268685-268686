import React from 'react';
import {render, screen} from '@testing-library/react';

import {App} from './App';

test('renders app without crashing', () => {
    render(<App />);
    // The auth layout brand should appear by default because /app redirects to /login.
    expect(screen.getByText('Habit Tracker')).toBeInTheDocument();
});
