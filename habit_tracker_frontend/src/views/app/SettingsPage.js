import React, {useMemo, useState} from 'react';

import {getEnv} from '../../config/env';
import {Button} from '../../ui/primitives/Button';
import {FormField} from '../../ui/primitives/FormField';
import {useData} from '../../state/data/DataContext';

function guessTimezones() {
    // Minimal curated list to avoid external deps.
    return [
        'UTC',
        'America/Los_Angeles',
        'America/Denver',
        'America/Chicago',
        'America/New_York',
        'Europe/London',
        'Europe/Berlin',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Singapore',
        'Australia/Sydney'
    ];
}

// PUBLIC_INTERFACE
export function SettingsPage() {
    /** Settings page for time zone, notifications, and sync status. */
    const env = getEnv();
    const data = useData();
    const settings = data.getSettings();
    const snapshot = data.getSnapshot();

    const [syncStatus, setSyncStatus] = useState('');
    const tzOptions = useMemo(() => guessTimezones(), []);

    async function onSyncNow() {
        setSyncStatus('Syncing…');
        try {
            const resp = await data.syncNow();
            if (resp && resp.skipped) {
                setSyncStatus(`Skipped: ${resp.reason}`);
                return;
            }
            setSyncStatus('Sync complete.');
        } catch (e) {
            setSyncStatus(e && e.message ? e.message : 'Sync failed.');
        }
    }

    return (
        <div>
            <h1 className="pageTitle">Settings</h1>
            <p className="pageHint">Manage timezone, notification preferences, and sync behavior.</p>

            <div className="grid2">
                <div className="card">
                    <div className="cardTitle">Preferences</div>
                    <div className="form">
                        <FormField label="Timezone" hint="Used for grouping check-ins by day.">
                            <select
                                className="input"
                                value={settings.timezone || 'UTC'}
                                onChange={(e) => data.updateSettings({timezone: e.target.value})}
                            >
                                {tzOptions.map((tz) => (
                                    <option key={tz} value={tz}>
                                        {tz}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <FormField label="Notifications">
                            <select
                                className="input"
                                value={settings.notificationsEnabled ? 'enabled' : 'disabled'}
                                onChange={(e) => data.updateSettings({notificationsEnabled: e.target.value === 'enabled'})}
                            >
                                <option value="enabled">Enabled</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </FormField>

                        <FormField label="Daily reminder time">
                            <input
                                className="input"
                                type="time"
                                value={settings.dailyReminderTime || '09:00'}
                                onChange={(e) => data.updateSettings({dailyReminderTime: e.target.value})}
                            />
                        </FormField>
                    </div>
                </div>

                <div className="card">
                    <div className="cardTitle">Sync</div>
                    <div className="kv">
                        <div className="kvRow">
                            <div className="kvKey">API Base</div>
                            <div className="kvVal">{env.apiBase || '— (offline-only)'}</div>
                        </div>
                        <div className="kvRow">
                            <div className="kvKey">Pending actions</div>
                            <div className="kvVal">{(snapshot.sync && snapshot.sync.pending && snapshot.sync.pending.length) || 0}</div>
                        </div>
                        <div className="kvRow">
                            <div className="kvKey">Last attempt</div>
                            <div className="kvVal">{(snapshot.sync && snapshot.sync.lastAttemptAt) || '—'}</div>
                        </div>
                        <div className="kvRow">
                            <div className="kvKey">Last success</div>
                            <div className="kvVal">{(snapshot.sync && snapshot.sync.lastSuccessAt) || '—'}</div>
                        </div>
                    </div>

                    {snapshot.sync && snapshot.sync.lastError ? (
                        <div className="alert alert--error" role="alert" style={{marginTop: 12}}>
                            {snapshot.sync.lastError}
                        </div>
                    ) : null}

                    <div style={{display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap'}}>
                        <Button onClick={onSyncNow}>Sync now</Button>
                        <span className="pill">{syncStatus || 'Best-effort sync (contract pending)'}</span>
                    </div>

                    <div className="mutedText" style={{marginTop: 10}}>
                        Cloud sync uses a placeholder <code>/sync</code> endpoint when <code>REACT_APP_API_BASE</code> is configured.
                        If the backend does not support it yet, your data remains safely local.
                    </div>
                </div>
            </div>
        </div>
    );
}
