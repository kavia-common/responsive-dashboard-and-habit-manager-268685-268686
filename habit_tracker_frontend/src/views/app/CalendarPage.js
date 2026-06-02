import React, {useMemo, useState} from 'react';

import {Button} from '../../ui/primitives/Button';
import {useData} from '../../state/data/DataContext';

function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(d, n) {
    const next = new Date(d);
    next.setDate(next.getDate() + n);
    return next;
}

function toKey(d) {
    // local date key (for UI); store uses a timezone-aware key but we query per date.
    return d.toISOString().slice(0, 10);
}

function formatMonth(d) {
    return d.toLocaleDateString(undefined, {month: 'long', year: 'numeric'});
}

function weekdayLabels() {
    const base = new Date(2023, 0, 2); // Monday
    return Array.from({length: 7}).map((_, i) => addDays(base, i).toLocaleDateString(undefined, {weekday: 'short'}));
}

function buildGrid(monthDate) {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const startWeekday = start.getDay(); // 0 Sun
    const leading = (startWeekday + 6) % 7; // make Monday=0
    const gridStart = addDays(start, -leading);

    const days = [];
    // 6 weeks grid for consistent layout
    for (let i = 0; i < 42; i += 1) {
        days.push(addDays(gridStart, i));
    }
    return {start, end, days};
}

function isSameMonth(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isToday(d) {
    const t = new Date();
    return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth() && t.getDate() === d.getDate();
}

function summarizeDay(checkins, habitsById) {
    if (!checkins.length) {
        return {count: 0, notes: []};
    }
    const notes = checkins
        .filter((c) => c.note)
        .slice(0, 3)
        .map((c) => {
            const h = habitsById.get(c.habitId);
            return `${h ? h.name : 'Habit'}: ${c.note}`;
        });
    return {count: checkins.length, notes};
}

// PUBLIC_INTERFACE
export function CalendarPage() {
    /** Calendar view showing check-ins per day. */
    const data = useData();
    const habits = data.listHabits({includeArchived: true});
    const habitsById = useMemo(() => new Map(habits.map((h) => [h.id, h])), [habits]);

    const [month, setMonth] = useState(() => new Date());
    const [selected, setSelected] = useState(() => new Date());

    const grid = useMemo(() => buildGrid(month), [month]);
    const selectedCheckins = useMemo(() => data.listCheckinsForDate(selected), [data, selected]);

    function prevMonth() {
        setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    }

    function nextMonth() {
        setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    }

    return (
        <div>
            <h1 className="pageTitle">Calendar</h1>
            <p className="pageHint">Review check-ins by day. Click a date to see notes and completed habits.</p>

            <div className="toolbar">
                <div className="toolbarLeft">
                    <Button variant="secondary" onClick={prevMonth}>
                        ←
                    </Button>
                    <div className="pill">{formatMonth(month)}</div>
                    <Button variant="secondary" onClick={nextMonth}>
                        →
                    </Button>
                </div>
                <div className="toolbarRight">
                    <span className="pill">Check-ins stored locally</span>
                </div>
            </div>

            <div className="card" style={{padding: 12}}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        gap: 8,
                        marginBottom: 8
                    }}
                >
                    {weekdayLabels().map((w) => (
                        <div key={w} className="mutedText" style={{fontSize: 12, textAlign: 'center'}}>
                            {w}
                        </div>
                    ))}
                </div>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8}}>
                    {grid.days.map((d) => {
                        const inMonth = isSameMonth(d, month);
                        const key = toKey(d);
                        const checkins = data.listCheckinsForDate(d);
                        const sum = summarizeDay(checkins, habitsById);
                        const active = toKey(selected) === key;

                        const bg = active ? 'rgba(59, 130, 246, 0.10)' : 'rgba(255, 255, 255, 0.9)';
                        const border = active ? 'rgba(59, 130, 246, 0.35)' : 'rgba(17, 24, 39, 0.10)';
                        const opacity = inMonth ? 1 : 0.55;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSelected(d)}
                                className="card"
                                style={{
                                    padding: 10,
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    background: bg,
                                    border: `1px solid ${border}`,
                                    opacity
                                }}
                                aria-pressed={active}
                            >
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                                    <div style={{fontWeight: 800}}>
                                        {d.getDate()}
                                        {isToday(d) ? <span style={{marginLeft: 6, color: 'rgba(37, 99, 235, 1)'}}>•</span> : null}
                                    </div>
                                    {sum.count ? <span className="chip chip--ok">{sum.count}</span> : <span className="chip">0</span>}
                                </div>
                                {sum.notes.length ? (
                                    <div className="mutedText" style={{marginTop: 8, fontSize: 12, lineHeight: 1.4}}>
                                        {sum.notes.map((n) => (
                                            <div key={n}>{n}</div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mutedText" style={{marginTop: 8, fontSize: 12}}>
                                        No notes
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid2" style={{marginTop: 14}}>
                <div className="card">
                    <div className="cardTitle">
                        {selected.toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'})}
                    </div>
                    {selectedCheckins.length ? (
                        <ul className="list">
                            {selectedCheckins.map((c) => {
                                const h = habitsById.get(c.habitId);
                                return (
                                    <li key={c.id}>
                                        <strong>{h ? h.name : 'Habit'}</strong> — {c.value}
                                        {c.note ? <span className="mutedText"> · {c.note}</span> : null}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="mutedText">No check-ins logged for this day yet.</div>
                    )}
                </div>
                <div className="card">
                    <div className="cardTitle">Tip</div>
                    <div className="mutedText">
                        Log check-ins from the Habits page. This calendar reflects your local data and will sync once a backend contract is confirmed.
                    </div>
                </div>
            </div>
        </div>
    );
}
