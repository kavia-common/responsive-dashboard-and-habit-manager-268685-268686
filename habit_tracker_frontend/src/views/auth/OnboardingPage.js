import React from 'react';
import {Link} from 'react-router-dom';

import {useAuth} from '../../state/auth/AuthContext';
import {Button} from '../../ui/primitives/Button';

// PUBLIC_INTERFACE
export function OnboardingPage() {
    /** Minimal onboarding placeholder; will be expanded in later steps. */
    const auth = useAuth();

    return (
        <div>
            <h1 className="pageTitle">Onboarding</h1>
            <p className="pageHint">
                Next we’ll set up your first habit, schedule, and reminder preferences.
            </p>

            <div className="card">
                <h2 className="cardTitle">What’s next</h2>
                <ul className="list">
                    <li>Create your first habit</li>
                    <li>Choose a schedule and a daily goal</li>
                    <li>Set reminder preferences</li>
                </ul>

                {auth.isAuthenticated ? (
                    <Link to="/app">
                        <Button>Go to dashboard</Button>
                    </Link>
                ) : (
                    <Link to="/login">
                        <Button>Sign in</Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
