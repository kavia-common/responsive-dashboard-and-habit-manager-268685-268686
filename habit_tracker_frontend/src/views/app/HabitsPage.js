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

function asInt(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function serializeDays(days) {
    const set = new Set(Array.isArray(days) ? days : []);
    return DAYS.map((d) => (set.has(d.k) ? d.label : null)).filter(Boolean).join(', ');
}

function scheduleHint(h) {
    if (h.schedule === 'daily') {
        return 'Daily';
    }
    if (h.schedule === 'weekly') {
        return `Weekly (${serializeDays(h.daysOfWeek) || '—'})`;
    }
    return `Custom (${serializeDays(h.daysOfWeek) || '—'})`;
}

function todayLabel() {
    const d = new Date();
    return d.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'});
}

function habitCompletionPercentForToday(habit, checkin) {
    const goal = Math.max(1, asInt(habit.goalPerPeriod, 1));
    const v = checkin ? asInt(checkin.value, 0) : 0;
    const pct = Math.max(0, Math.min(100, Math.round((v / goal) * 100)));
    return pct;
}

function defaultHabitDraft() {
    return {
        id: null,
        name: '',
        description: '',
        schedule: 'daily',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
        goalPerPeriod: 1,
        goalUnit: 'times',
        color: '#3B82F6',
        isArchived: false
    };
}

// PUBLIC_INTERFACE
export function HabitsPage() {
    /** Habits CRUD page with modal editing and quick daily check-ins. */
    const data = useData();
    const habits = data.listHabits({includeArchived: false});
    const settings = data.getSettings();

    const [editing, setEditing] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');

    const today = useMemo(() => new Date(), []);
    const todayCheckinsByHabit = useMemo(() => {
        const list = data.listCheckinsForDate(today);
        const map = new Map();
        list.forEach((c) => map.set(c.habitId, c));
        return map;
    }, [data, today]);

    function openCreate() {
        setError('');
        setEditing(defaultHabitDraft());
        setShowModal(true);
    }

    function openEdit(h) {
        setError('');
        setEditing(Object.assign({}, defaultHabitDraft(), h));
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

    function onSaveHabit() {
        setError('');
        try {
            const payload = Object.assign({}, editing, {
                goalPerPeriod: asInt(editing.goalPerPeriod, 1)
            });
            data.upsertHabit(payload);
            closeModal();
        } catch (e) {
            setError(e && e.message ? e.message : 'Unable to save habit.');
        }
    }

    function onArchiveHabit(h) {
        data.archiveHabit(h.id);
    }

    function onDeleteHabit(h) {
        // eslint-disable-next-line no-alert
        const ok = window.confirm('Delete this habit? This will remove related check-ins and reminders.');
        if (!ok) {
            return;
        }
        data.deleteHabit(h.id);
    }

    function onQuickCheckin(habit, value, note) {
        const existing = data.getCheckin(habit.id, today);
        data.upsertCheckin({
            id: existing ? existing.id : null,
            habitId: habit.id,
            date: today,
            value,
            note
        });
    }

    return (
        <div>
            <h1 className="pageTitle">Habits</h1>
            <p className="pageHint">
                Create and manage habits, set schedules/goals, and log today’s check-ins ({todayLabel()} · TZ: {settings.timezone}).
            </p>

            <div className="toolbar">
                <div className="toolbarLeft">
                    <span className="pill">{habits.length} active</span>
                    <span className="pill">Local-first</span>
                </div>
                <div className="toolbarRight">
                    <Button onClick={openCreate}>New habit</Button>
                </div>
            </div>

            <div className="card">
                {habits.length ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Habit</th>
                                <th>Schedule / Goal</th>
                                <th>Today</th>
                                <th aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {habits.map((h) => {
                                const checkin = todayCheckinsByHabit.get(h.id) || null;
                                const pct = habitCompletionPercentForToday(h, checkin);
                                const value = checkin ? checkin.value : 0;
                                return (
                                    <tr key={h.id}>
                                        <td>
                                            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                                                <span
                                                    className="chip"
                                                    style={{
                                                        borderColor: `${h.color}55`,
                                                        color: h.color,
                                                        background: `${h.color}10`
                                                    }}
                                                >
                                                    {h.name}
                                                </span>
                                            </div>
                                            {h.description ? <div className="mutedText">{h.description}</div> : null}
                                        </td>
                                        <td>
                                            <div className="mutedText">{scheduleHint(h)}</div>
                                            <div className="mutedText">
                                                Goal: {h.goalPerPeriod} {h.goalUnit}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="chipRow" style={{marginBottom: 8}}>
                                                <span className={`chip ${pct >= 100 ? 'chip--ok' : 'chip--warn'}`}>
                                                    {value}/{Math.max(1, asInt(h.goalPerPeriod, 1))}
                                                </span>
                                                {checkin && checkin.note ? <span className="chip">{checkin.note}</span> : null}
                                            </div>
                                            <div className="bar" aria-label={`Completion ${pct}%`}>
                                                <div className="barFill" style={{width: `${pct}%`}} />
                                            </div>
                                            <div style={{display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap'}}>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => onQuickCheckin(h, asInt(value, 0) + 1, checkin ? checkin.note : '')}
                                                >
                                                    +1
                                                </Button>
                                                <Button variant="secondary" onClick={() => onQuickCheckin(h, 0, '')}>
                                                    Reset
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        // eslint-disable-next-line no-alert
                                                        const note = window.prompt('Add a note for today:', checkin ? checkin.note || '' : '');
                                                        if (note === null) {
                                                            return;
                                                        }
                                                        onQuickCheckin(h, asInt(value, 0) || 1, note);
                                                    }}
                                                >
                                                    Note
                                                </Button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="rowActions">
                                                <Button variant="secondary" onClick={() => openEdit(h)}>
                                                    Edit
                                                </Button>
                                                <Button variant="secondary" onClick={() => onArchiveHabit(h)}>
                                                    Archive
                                                </Button>
                                                <Button variant="secondary" onClick={() => onDeleteHabit(h)}>
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
                    <div className="mutedText">
                        No habits yet. Create your first habit to start tracking daily check-ins.
                    </div>
                )}
            </div>

            <Modal
                title={editing && editing.id ? 'Edit habit' : 'New habit'}
                isOpen={showModal}
                onClose={closeModal}
                closeOnBackdrop={true}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button onClick={onSaveHabit}>Save</Button>
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
                        <FormField label="Name">
                            <input
                                className="input"
                                type="text"
                                value={editing.name}
                                onChange={(e) => setEditing(Object.assign({}, editing, {name: e.target.value}))}
                                required
                            />
                        </FormField>

                        <FormField label="Description" hint="Optional. Keep it actionable and short.">
                            <textarea
                                className="input"
                                style={{height: 84, resize: 'vertical'}}
                                value={editing.description}
                                onChange={(e) => setEditing(Object.assign({}, editing, {description: e.target.value}))}
                            />
                        </FormField>

                        <div className="grid2">
                            <FormField label="Schedule">
                                <select
                                    className="input"
                                    value={editing.schedule}
                                    onChange={(e) => setEditing(Object.assign({}, editing, {schedule: e.target.value}))}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </FormField>

                            <FormField label="Goal">
                                <div style={{display: 'flex', gap: 10}}>
                                    <input
                                        className="input"
                                        style={{flex: 1}}
                                        type="number"
                                        min={1}
                                        value={editing.goalPerPeriod}
                                        onChange={(e) => setEditing(Object.assign({}, editing, {goalPerPeriod: e.target.value}))}
                                    />
                                    <input
                                        className="input"
                                        style={{flex: 1}}
                                        type="text"
                                        value={editing.goalUnit}
                                        onChange={(e) => setEditing(Object.assign({}, editing, {goalUnit: e.target.value}))}
                                    />
                                </div>
                            </FormField>
                        </div>

                        <FormField label="Days of week" hint="Applies to weekly/custom schedules.">
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

                        <FormField label="Color">
                            <input
                                className="input"
                                type="color"
                                value={editing.color}
                                onChange={(e) => setEditing(Object.assign({}, editing, {color: e.target.value}))}
                                aria-label="Habit color"
                            />
                        </FormField>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}
