import React, {useMemo, useState} from 'react';
import {NavLink, Outlet, useNavigate} from 'react-router-dom';

import {useAuth} from '../../state/auth/AuthContext';
import {Button} from '../primitives/Button';

const NAV_ITEMS = [
    {to: '/app', label: 'Dashboard'},
    {to: '/app/habits', label: 'Habits'},
    {to: '/app/calendar', label: 'Calendar'},
    {to: '/app/reminders', label: 'Reminders'},
    {to: '/app/analytics', label: 'Analytics'},
    {to: '/app/export', label: 'Export'},
    {to: '/app/settings', label: 'Settings'}
];

// PUBLIC_INTERFACE
export function AppShellLayout() {
    /** Responsive shell with sidebar navigation and main content outlet. */
    const auth = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const userLabel = useMemo(() => {
        if (!auth.user) {
            return 'Signed in';
        }
        return auth.user.name || auth.user.email || 'Signed in';
    }, [auth.user]);

    function onLogout() {
        auth.logout();
        navigate('/login');
    }

    function closeMobile() {
        setMobileOpen(false);
    }

    return (
        <div className="appShell">
            <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`} aria-label="Sidebar navigation">
                <div className="sidebarHeader">
                    <div className="sidebarBrand">
                        <div className="sidebarLogo" aria-hidden="true">H</div>
                        <div className="sidebarBrandText">
                            <div className="sidebarBrandTitle">Habit Tracker</div>
                            <div className="sidebarBrandSubtitle">{userLabel}</div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="iconButton sidebarClose"
                        onClick={closeMobile}
                        aria-label="Close navigation"
                    >
                        ✕
                    </button>
                </div>

                <nav className="sidebarNav" aria-label="Primary">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({isActive}) => `navItem ${isActive ? 'navItem--active' : ''}`}
                            onClick={closeMobile}
                            end={item.to === '/app'}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebarFooter">
                    <Button variant="secondary" onClick={onLogout}>
                        Log out
                    </Button>
                </div>
            </aside>

            <div className="main">
                <header className="topbar">
                    <button
                        type="button"
                        className="iconButton"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                    >
                        ☰
                    </button>
                    <div className="topbarTitle">Habit Tracker</div>
                    <div className="topbarSpacer" />
                    <div className="topbarRight">
                        <span className="pill">Light theme</span>
                    </div>
                </header>

                <main className="content" role="main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
