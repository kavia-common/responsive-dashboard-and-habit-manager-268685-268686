import React, {useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';

import {useAuth} from '../../state/auth/AuthContext';
import {Button} from '../../ui/primitives/Button';

// PUBLIC_INTERFACE
export function LoginPage() {
    /** Login page allowing users to authenticate and enter the /app area. */
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            await auth.login(email, password);
            const from = (location.state && location.state.from) ? location.state.from : '/app';
            navigate(from);
        } catch (err) {
            setError(err && err.message ? err.message : 'Unable to login.');
        }
    }

    return (
        <div>
            <h1 className="pageTitle">Sign in</h1>
            <p className="pageHint">Use your account to manage habits, reminders, and analytics.</p>

            {error ? <div className="alert alert--error" role="alert">{error}</div> : null}

            <form onSubmit={onSubmit} className="form">
                <label className="field">
                    <span className="fieldLabel">Email</span>
                    <input
                        className="input"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>

                <label className="field">
                    <span className="fieldLabel">Password</span>
                    <input
                        className="input"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>

                <div className="formRow">
                    <Button type="submit" disabled={auth.status === 'loading'}>
                        {auth.status === 'loading' ? 'Signing in…' : 'Sign in'}
                    </Button>
                </div>

                <div className="mutedRow">
                    <span>New here?</span> <Link to="/register">Create an account</Link>
                </div>
            </form>
        </div>
    );
}
