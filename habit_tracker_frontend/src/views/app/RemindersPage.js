import React, {useMemo, useState} from 'react';

import {Button} from '../../ui/primitives/Button';
import {Modal} from '../../ui/primitives/Modal';
import {FormField} from '../../ui/primitives/FormField';
import {useData} from '../../state/data/DataContext';

const DAYS = [
    {k: 1, label: 'Mon'},
    {k: 2, label: 'Tue'},
    {k: 3, label: 'Wed'},
    {k: 4, label: 'Thu'},
    {k: 5, label: 'Fri'},
    {k: 6, label: 'Sat'},
    {k: 0, label: 'Sun'}
];

function defaultDraft() {
    return {
        id: null,
        habitId: null,
        title: '',
        time: '09:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        enabled: true
    };
}

function serializeDays(days) {
    const set = new Set(Array.isArray(days) ? days : []);
    return DAYS.map((d) => (set.has(d.k) ? d.label : null)).filter(Boolean).join(', ');
}

// PUBLIC_INTERFACE
export function RemindersPage() {
    /** Reminders CRUD and preferences management page. */
    const data = useData();
    const habits = data.listHabits({includeArchived: false});
    const reminders = data.listReminders();
    const settings = data.getSettings();

    const habitsById = useMemo(() => new Map(habits.map((h) => [h.id, h])), [habits]);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');

    function openCreate() {
        setError('');
        setEditing(defaultDraft());
        setShowModal(true);
    }

    function openEdit(r) {
        setError('');
        setEditing(Object.assign({}, defaultDraft(), r));
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditing(null);
        setError('');
    }

    function toggleDay(dayKey) {
        const next = Object.assign({}, editing);
        const set = new Set(next.daysOfWeek || []);
        if (set.has(dayKey)) {
            set.delete(dayKey);
        } else {
            set.add(dayKey);
        }
        next.daysOfWeek = Array.from(set);
        setEditing(next);
    }

    function onSave() {
        setError('');
        try {
            data.upsertReminder(editing);
            closeModal();
        } catch (e) {
            setError(e && e.message ? e.message : 'Unable to save reminder.');
        }
    }

    function onDelete(r) {
        // eslint-disable-next-line no-alert
        const ok = window.confirm('Delete this reminder?');
        if (!ok) {
            return;
        }
        data.deleteReminder(r.id);
    }

    function setPref(patch) {
        data.updateSettings(patch);
    }

    return (
        <div>
            <h1 className="pageTitle">Reminders</h1>
            <p className="pageHint">
                Manage reminder schedules. Notifications are stored as preferences (delivery depends on future backend/push integration).
            </p>

            <div className="grid2">
                <div className="card">
                    <div className="cardTitle">Preferences</div>
                    <div className="form">
                        <FormField label="Notifications enabled">
                            <select
                                className="input"
                                value={settings.notificationsEnabled ? 'yes' : 'no'}
                                onChange={(e) => setPref({notificationsEnabled: e.target.value === 'yes'})}
                            >
                                <option value="yes">Enabled</option>
                                <option value="no">Disabled</option>
                            </select>
                        </FormField>

                        <FormField label="Default daily reminder time" hint="Used by reminders that are not habit-specific.">
                            <input
                                className="input"
                                type="time"
                                value={settings.dailyReminderTime || '09:00'}
                                onChange={(e) => setPref({dailyReminderTime: e.target.value})}
                            />
                        </FormField>

                        <div className="mutedText">
                            Tip: reminders are managed locally for now; a backend can later deliver push/email/SMS based on this schedule.
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="toolbar" style={{marginBottom: 10}}>
                        <div className="toolbarLeft">
                            <div className="cardTitle" style={{margin: 0}}>
                                Reminder schedules
                            </div>
                        </div>
                        <div className="toolbarRight">
                            <Button onClick={openCreate}>New reminder</Button>
                        </div>
                    </div>

                    {reminders.length ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Reminder</th>
                                    <th>Schedule</th>
                                    <th>Status</th>
                                    <th aria-label="Actions" />
                                </tr>
                            </thead>
                            <tbody>
                                {reminders.map((r) => {
                                    const habit = r.habitId ? habitsById.get(r.habitId) : null;
                                    return (
                                        <tr key={r.id}>
                                            <td>
                                                <div style={{fontWeight: 800}}>{r.title}</div>
                                                <div className="mutedText">{habit ? `Habit: ${habit.name}` : 'General reminder'}</div>
                                            </td>
                                            <td>
                                                <div className="mutedText">
                                                    {r.time} · {serializeDays(r.daysOfWeek) || '—'}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`chip ${r.enabled ? 'chip--ok' : 'chip--danger'}`}>
                                                    {r.enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="rowActions">
                                                    <Button variant="secondary" onClick={() => openEdit(r)}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="secondary" onClick={() => onDelete(r)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="mutedText">No reminders yet. Create a schedule to stay on track.</div>
                    )}
                </div>
            </div>

            <Modal
                title={editing && editing.id ? 'Edit reminder' : 'New reminder'}
                isOpen={showModal}
                onClose={closeModal}
                closeOnBackdrop={true}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button onClick={onSave}>Save</Button>
                    </>
                }
            >
                {error ? (
                    <div className="alert alert--error" role="alert" style={{marginBottom: 10}}>
                        {error}
                    </div>
                ) : null}

                {editing ? (
                    <div className="form">
                        <FormField label="Title">
                            <input
                                className="input"
                                type="text"
                                value={editing.title}
                                onChange={(e) => setEditing(Object.assign({}, editing, {title: e.target.value}))}
                                required
                            />
                        </FormField>

                        <FormField label="Habit (optional)" hint="Associate this reminder with a specific habit.">
                            <select
                                className="input"
                                value={editing.habitId || ''}
                                onChange={(e) => setEditing(Object.assign({}, editing, {habitId: e.target.value || null}))}
                            >
                                <option value="">General reminder</option>
                                {habits.map((h) => (
                                    <option key={h.id} value={h.id}>
                                        {h.name}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <div className="grid2">
                            <FormField label="Time">
                                <input
                                    className="input"
                                    type="time"
                                    value={editing.time}
                                    onChange={(e) => setEditing(Object.assign({}, editing, {time: e.target.value}))}
                                />
                            </FormField>

                            <FormField label="Enabled">
                                <select
                                    className="input"
                                    value={editing.enabled ? 'yes' : 'no'}
                                    onChange={(e) => setEditing(Object.assign({}, editing, {enabled: e.target.value === 'yes'}))}
                                >
                                    <option value="yes">Enabled</option>
                                    <option value="no">Disabled</option>
                                </select>
                            </FormField>
                        </div>

                        <FormField label="Days of week">
                            <div className="chipRow">
                                {DAYS.map((d) => {
                                    const active = (editing.daysOfWeek || []).includes(d.k);
                                    return (
                                        <button
                                            key={d.k}
                                            type="button"
                                            className={`chip ${active ? 'chip--ok' : ''}`}
                                            onClick={() => toggleDay(d.k)}
                                            aria-pressed={active}
                                        >
                                            {d.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </FormField>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}
