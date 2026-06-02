import React, {useMemo} from 'react';

import {Link} from 'react-router-dom';
import {Button} from '../../ui/primitives/Button';
import {useData} from '../../state/data/DataContext';

function todayLabel() {
    const d = new Date();
    return d.toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'});
}

function addDays(d, n) {
    const next = new Date(d);
    next.setDate(next.getDate() + n);
    return next;
}

function isScheduledToday(habit) {
    if (!habit) {
        return false;
    }
    if (habit.schedule === 'daily') {
        return true;
    }
    const dow = new Date().getDay();
    return Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek.includes(dow) : true;
}

function serializeDays(days) {
    const map = new Map([
        [1, 'Mon'],
        [2, 'Tue'],
        [3, 'Wed'],
        [4, 'Thu'],
        [5, 'Fri'],
        [6, 'Sat'],
        [0, 'Sun']
    ]);
    const set = new Set(Array.isArray(days) ? days : []);
    return Array.from(set)
        .map((d) => map.get(d) || '')
        .filter(Boolean)
        .join(', ');
}

function inNextNDays(reminder, n) {
    // UI heuristic (no TZ library): any enabled reminder counts.
    return reminder && reminder.enabled && n >= 1;
}

// PUBLIC_INTERFACE
export function DashboardPage() {
    /** Dashboard overview of today's scheduled habits and quick actions. */
    const data = useData();
    const habits = data.listHabits({includeArchived: false});
    const reminders = data.listReminders();
    const settings = data.getSettings();
    const today = useMemo(() => new Date(), []);

    const scheduled = useMemo(() => habits.filter(isScheduledToday), [habits]);
    const todayCheckins = useMemo(() => data.listCheckinsForDate(today), [data, today]);
    const checkinsByHabit = useMemo(() => new Map(todayCheckins.map((c) => [c.habitId, c])), [todayCheckins]);

    const upcoming = useMemo(() => {
        return reminders
            .filter((r) => inNextNDays(r, 2))
            .slice(0, 4)
            .map((r) => {
                const h = r.habitId ? habits.find((hh) => hh.id === r.habitId) : null;
                return {rem: r, habit: h};
            });
    }, [reminders, habits]);

    function onQuickDone(h) {
        const existing = data.getCheckin(h.id, today);
        data.upsertCheckin({
            id: existing ? existing.id : null,
            habitId: h.id,
            date: today,
            value: Math.max(1, h.goalPerPeriod || 1),
            note: existing ? existing.note : ''
        });
    }

    return (
        <div>
            <h1 className="pageTitle">Dashboard</h1>
            <p className="pageHint">
                {todayLabel()} · Timezone: {settings.timezone}. Quick check-ins update your local data immediately.
            </p>

            <div className="grid2">
                <div className="card">
                    <div className="cardTitle">Today</div>
                    {scheduled.length ? (
                        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                            {scheduled.slice(0, 6).map((h) => {
                                const c = checkinsByHabit.get(h.id);
                                const done = c && (c.value || 0) >= (h.goalPerPeriod || 1);
                                return (
                                    <div key={h.id} style={{display: 'flex', alignItems: 'center', gap: 10}}>
                                        <span className={`chip ${done ? 'chip--ok' : ''}`}>{h.name}</span>
                                        <span className="mutedText">
                                            Goal {h.goalPerPeriod} {h.goalUnit}
                                        </span>
                                        <div style={{flex: 1}} />
                                        <Button variant="secondary" onClick={() => onQuickDone(h)} disabled={done}>
                                            {done ? 'Done' : 'Mark done'}
                                        </Button>
                                    </div>
                                );
                            })}
                            <div style={{marginTop: 8}}>
                                <Link to="/app/habits">
                                    <Button variant="secondary">Manage habits</Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="mutedText">
                            No scheduled habits today. Create one on the Habits page.
                            <div style={{marginTop: 10}}>
                                <Link to="/app/habits">
                                    <Button>New habit</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="cardTitle">Reminders preview</div>
                    {upcoming.length ? (
                        <ul className="list">
                            {upcoming.map((x) => (
                                <li key={x.rem.id}>
                                    <strong>{x.rem.title}</strong> — {x.rem.time} · {serializeDays(x.rem.daysOfWeek)}
                                    <span className="mutedText">
                                        {x.habit ? ` · for ${x.habit.name}` : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mutedText">
                            No reminder schedules yet. Configure reminders to stay consistent.
                        </div>
                    )}

                    <div style={{marginTop: 10}}>
                        <Link to="/app/reminders">
                            <Button variant="secondary">Manage reminders</Button>
                        </Link>
                    </div>

                    <div className="mutedText" style={{marginTop: 10}}>
                        Delivery is preference-only for now; actual notifications can be implemented via backend or browser notifications later.
                    </div>
                </div>
            </div>

            <div className="card" style={{marginTop: 14}}>
                <div className="cardTitle">Quick links</div>
                <div className="chipRow">
                    <Link to="/app/calendar" className="chip">
                        Calendar
                    </Link>
                    <Link to="/app/analytics" className="chip">
                        Analytics
                    </Link>
                    <Link to="/app/export" className="chip">
                        Export
                    </Link>
                </div>
            </div>
        </div>
    );
}
