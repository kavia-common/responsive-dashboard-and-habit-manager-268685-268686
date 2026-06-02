import React from 'react';

import {getEnv} from '../../config/env';

// PUBLIC_INTERFACE
export function SettingsPage() {
    /** Settings page for time zone and notification preferences (placeholder). */
    const env = getEnv();

    return (
        <div>
            <h1 className="pageTitle">Settings</h1>
            <p className="pageHint">Manage timezone, notifications, and account preferences.</p>

            <div className="grid2">
                <div className="card">
                    <div className="cardTitle">Environment</div>
                    <div className="kv">
                        <div className="kvRow"><div className="kvKey">API Base</div><div className="kvVal">{env.apiBase || '—'}</div></div>
                        <div className="kvRow"><div className="kvKey">WS URL</div><div className="kvVal">{env.wsUrl || '—'}</div></div>
                    </div>
                </div>
                <div className="card">
                    <div className="cardTitle">Preferences</div>
                    <div className="mutedText">Preferences UI will be implemented in the next step.</div>
                </div>
            </div>
        </div>
    );
}
