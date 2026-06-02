import React, {useMemo} from 'react';

import {useData} from '../../state/data/DataContext';

function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
}

function isoDate(d) {
    return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
    const next = new Date(d);
    next.setDate(next.getDate() + n);
    return next;
}

function lastNDays(n) {
    const end = new Date();
    const start = addDays(end, -(n - 1));
    const days = [];
    for (let i = 0; i < n; i += 1) {
        days.push(addDays(start, i));
    }
    return days;
}

function computeHabitStats(habit, checkins) {
    // Consider check-in "done" if value >= 1.
    const total = checkins.length;
    const done = checkins.filter((c) => (c.value || 0) >= 1).length;
    const rate = total ? Math.round((done / total) * 100) : 0;
    return {total, done, rate};
}

function computeStreakLike(checkinsByDateKey, days) {
    // Streak proxy: consecutive days with at least one check-in.
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i -= 1) {
        const d = days[i];
        const keyPrefix = `${isoDate(d)}|`;
        const has = Array.from(checkinsByDateKey.keys()).some((k) => k.startsWith(keyPrefix) && checkinsByDateKey.get(k).length);
        if (!has) {
            break;
        }
        streak += 1;
    }
    return streak;
}

// PUBLIC_INTERFACE
export function AnalyticsPage() {
    /** Analytics dashboard based on local check-ins (no backend required). */
    const data = useData();
    const habits = data.listHabits({includeArchived: false});
    const days = useMemo(() => lastNDays(14), []);
    const settings = data.getSettings();

    const checkinsByDateKey = useMemo(() => {
        const snap = data.getSnapshot();
        const map = new Map();
        (snap.checkins || []).forEach((c) => {
            const list = map.get(c.dateKey) || [];
            list.push(c);
            map.set(c.dateKey, list);
        });
        return map;
    }, [data]);

    const streak = useMemo(() => computeStreakLike(checkinsByDateKey, days), [checkinsByDateKey, days]);

    const habitRows = useMemo(() => {
        return habits
            .map((h) => {
                const cs = data.listCheckinsForHabit(h.id);
                const recent = cs.filter((c) => {
                    // include last 30 days rough filter by createdAt date
                    const dt = new Date(c.createdAt);
                    return dt >= addDays(new Date(), -30);
                });
                const stats = computeHabitStats(h, recent);
                return {habit: h, stats};
            })
            .sort((a, b) => b.stats.rate - a.stats.rate);
    }, [data, habits]);

    return (
        <div>
            <h1 className="pageTitle">Analytics</h1>
            <p className="pageHint">Trends based on your local check-ins. TZ: {settings.timezone}.</p>

            <div className="chartGrid">
                <div className="card">
                    <div className="cardTitle">14-day streak (proxy)</div>
                    <div className="mutedText">Days in a row with at least one check-in.</div>
                    <div style={{fontSize: 34, fontWeight: 900, marginTop: 10}}>{streak}</div>
                </div>
                <div className="card">
                    <div className="cardTitle">Active habits</div>
                    <div className="mutedText">Habits that are not archived.</div>
                    <div style={{fontSize: 34, fontWeight: 900, marginTop: 10}}>{habits.length}</div>
                </div>
                <div className="card">
                    <div className="cardTitle">Sync status</div>
                    <div className="mutedText">Cloud sync is queued; contract pending backend.</div>
                    <div className="chipRow" style={{marginTop: 10}}>
                        <span className="chip">Local-first</span>
                        <span className="chip chip--warn">Best-effort sync</span>
                    </div>
                </div>
            </div>

            <div className="card" style={{marginTop: 14}}>
                <div className="cardTitle">Completion (last 30 days)</div>
                {habitRows.length ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Habit</th>
                                <th>Done</th>
                                <th>Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {habitRows.map((row) => {
                                const pct = clamp(row.stats.rate, 0, 100);
                                return (
                                    <tr key={row.habit.id}>
                                        <td>
                                            <div style={{fontWeight: 800}}>{row.habit.name}</div>
                                            <div className="mutedText">{row.habit.goalPerPeriod} {row.habit.goalUnit} · {row.habit.schedule}</div>
                                        </td>
                                        <td className="mutedText">
                                            {row.stats.done}/{row.stats.total}
                                        </td>
                                        <td style={{minWidth: 180}}>
                                            <div className="bar" aria-label={`Rate ${pct}%`}>
                                                <div className="barFill" style={{width: `${pct}%`}} />
                                            </div>
                                            <div className="mutedText" style={{fontSize: 12, marginTop: 6}}>
                                                {pct}%
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="mutedText">No habits yet. Create habits and log check-ins to see trends.</div>
                )}
            </div>
        </div>
    );
}
