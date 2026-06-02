import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {useAuth} from '../../state/auth/AuthContext';
import {Button} from '../../ui/primitives/Button';

// PUBLIC_INTERFACE
export function RegisterPage() {
    /** Registration page to create a new account. */
    const auth = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            await auth.register({name, email, password});
            // On success, move to onboarding; if backend doesn't auto-login, onboarding will still show.
            navigate('/onboarding');
        } catch (err) {
            setError(err && err.message ? err.message : 'Unable to register.');
        }
    }

    return (
        <div>
            <h1 className="pageTitle">Create account</h1>
            <p className="pageHint">Start with a simple habit system and refine over time.</p>

            {error ? <div className="alert alert--error" role="alert">{error}</div> : null}

            <form onSubmit={onSubmit} className="form">
                <label className="field">
                    <span className="fieldLabel">Name</span>
                    <input
                        className="input"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </label>

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
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                </label>

                <div className="formRow">
                    <Button type="submit" disabled={auth.status === 'loading'}>
                        {auth.status === 'loading' ? 'Creating…' : 'Create account'}
                    </Button>
                </div>

                <div className="mutedRow">
                    <span>Already have an account?</span> <Link to="/login">Sign in</Link>
                </div>
            </form>
        </div>
    );
}
