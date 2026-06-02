import {getEnv} from '../../config/env';
import {createApiClient} from '../../api/apiClient';

/**
 * Local-first store with sync-ready semantics:
 * - All user data is stored in localStorage as the source of truth.
 * - Mutations enqueue "sync actions" that can later be pushed to a backend.
 * - If an API base is configured, we attempt best-effort sync; otherwise we
 *   gracefully remain offline-only.
 *
 * This is intentionally backend-contract-agnostic: endpoints are conservative
 * placeholders and failures do not break UI flows.
 */

const STORAGE_KEY = 'habit_tracker_data_v1';
const DEFAULT_TIMEZONE = 'UTC';

function nowIso() {
    return new Date().toISOString();
}

function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

function uuid() {
    // Good-enough client id for local-first usage.
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function startOfDayIso(date, tz) {
    // For simplicity (no external deps), treat date as local time.
    // The "timezone" setting is stored for display and future backend alignment.
    const d = new Date(date);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const localMidnight = new Date(y, m, day, 0, 0, 0, 0);
    const iso = localMidnight.toISOString().slice(0, 10);
    return `${iso}|${tz || DEFAULT_TIMEZONE}`;
}

function defaultData() {
    return {
        version: 1,
        meta: {
            createdAt: nowIso(),
            updatedAt: nowIso()
        },
        habits: [],
        checkins: [],
        reminders: [],
        settings: {
            timezone: DEFAULT_TIMEZONE,
            notificationsEnabled: true,
            dailyReminderTime: '09:00'
        },
        sync: {
            pending: [],
            lastAttemptAt: null,
            lastSuccessAt: null,
            lastError: null
        }
    };
}

function normalizeHabit(h) {
    const createdAt = h.createdAt || nowIso();
    return {
        id: h.id || uuid(),
        name: (h.name || '').trim(),
        description: (h.description || '').trim(),
        // schedule: 'daily' | 'weekly' | 'custom'
        schedule: h.schedule || 'daily',
        daysOfWeek: Array.isArray(h.daysOfWeek) ? h.daysOfWeek : [1, 2, 3, 4, 5, 6, 0], // default every day
        goalPerPeriod: Number.isFinite(h.goalPerPeriod) ? h.goalPerPeriod : 1,
        goalUnit: (h.goalUnit || 'times').trim(),
        color: h.color || '#3B82F6',
        isArchived: Boolean(h.isArchived),
        createdAt,
        updatedAt: nowIso()
    };
}

function normalizeReminder(r) {
    return {
        id: r.id || uuid(),
        habitId: r.habitId || null,
        title: (r.title || '').trim(),
        time: r.time || '09:00',
        daysOfWeek: Array.isArray(r.daysOfWeek) ? r.daysOfWeek : [1, 2, 3, 4, 5],
        enabled: r.enabled !== false,
        createdAt: r.createdAt || nowIso(),
        updatedAt: nowIso()
    };
}

function normalizeCheckin(c) {
    return {
        id: c.id || uuid(),
        habitId: c.habitId,
        // dateKey encodes day + timezone so we can group by "user day"
        dateKey: c.dateKey,
        value: Number.isFinite(c.value) ? c.value : 1,
        note: (c.note || '').trim(),
        createdAt: c.createdAt || nowIso(),
        updatedAt: nowIso()
    };
}

function readData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? safeParse(raw) : null;
    if (!parsed || typeof parsed !== 'object') {
        return defaultData();
    }
    return Object.assign(defaultData(), parsed);
}

function writeData(next) {
    const data = Object.assign({}, next, {
        meta: Object.assign({}, next.meta, {updatedAt: nowIso()})
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
}

function enqueueSync(data, action) {
    const next = Object.assign({}, data, {
        sync: Object.assign({}, data.sync, {
            pending: [...(data.sync.pending || []), Object.assign({id: uuid(), createdAt: nowIso()}, action)]
        })
    });
    return writeData(next);
}

async function trySync(getTokenFn) {
    const env = getEnv();
    if (!env.apiBase) {
        return {ok: false, skipped: true, reason: 'No API base configured.'};
    }

    // Placeholder: we attempt to POST pending actions to /sync. If unavailable,
    // keep pending queue for later.
    const client = createApiClient(getTokenFn);
    const data = readData();
    const pending = data.sync.pending || [];
    if (!pending.length) {
        return {ok: true, skipped: true, reason: 'No pending actions.'};
    }

    const attemptAt = nowIso();
    try {
        await client.post('/sync', {actions: pending});
        const cleared = writeData(
            Object.assign({}, data, {
                sync: Object.assign({}, data.sync, {
                    pending: [],
                    lastAttemptAt: attemptAt,
                    lastSuccessAt: attemptAt,
                    lastError: null
                })
            })
        );
        return {ok: true, data: cleared};
    } catch (e) {
        const next = writeData(
            Object.assign({}, data, {
                sync: Object.assign({}, data.sync, {
                    lastAttemptAt: attemptAt,
                    lastError: e && e.message ? e.message : 'Sync failed.'
                })
            })
        );
        return {ok: false, error: e, data: next};
    }
}

// PUBLIC_INTERFACE
export function createLocalStore(getTokenFn) {
    /**
     * Creates a local-first data store for habits, check-ins, reminders, and settings.
     * @param {function(): (string|null)} getTokenFn Token accessor used for best-effort sync.
     */
    function getSnapshot() {
        return readData();
    }

    function listHabits(opts) {
        const o = opts || {};
        const data = readData();
        const habits = data.habits || [];
        const filtered = o.includeArchived ? habits : habits.filter((h) => !h.isArchived);
        return filtered.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    function upsertHabit(habit) {
        const data = readData();
        const normalized = normalizeHabit(habit || {});
        if (!normalized.name) {
            throw new Error('Habit name is required.');
        }
        const idx = (data.habits || []).findIndex((h) => h.id === normalized.id);
        const nextHabits = data.habits ? data.habits.slice() : [];
        if (idx >= 0) {
            nextHabits[idx] = Object.assign({}, nextHabits[idx], normalized, {updatedAt: nowIso()});
        } else {
            nextHabits.unshift(normalized);
        }

        const next = writeData(Object.assign({}, data, {habits: nextHabits}));
        enqueueSync(next, {type: 'habit.upsert', payload: normalized});
        return normalized;
    }

    function archiveHabit(habitId) {
        const data = readData();
        const nextHabits = (data.habits || []).map((h) => {
            if (h.id !== habitId) {
                return h;
            }
            return Object.assign({}, h, {isArchived: true, updatedAt: nowIso()});
        });
        const next = writeData(Object.assign({}, data, {habits: nextHabits}));
        enqueueSync(next, {type: 'habit.archive', payload: {id: habitId}});
    }

    function deleteHabit(habitId) {
        const data = readData();
        const nextHabits = (data.habits || []).filter((h) => h.id !== habitId);
        const nextCheckins = (data.checkins || []).filter((c) => c.habitId !== habitId);
        const nextReminders = (data.reminders || []).filter((r) => r.habitId !== habitId);
        const next = writeData(Object.assign({}, data, {habits: nextHabits, checkins: nextCheckins, reminders: nextReminders}));
        enqueueSync(next, {type: 'habit.delete', payload: {id: habitId}});
    }

    function listReminders() {
        const data = readData();
        return (data.reminders || []).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }

    function upsertReminder(reminder) {
        const data = readData();
        const normalized = normalizeReminder(reminder || {});
        if (!normalized.title) {
            throw new Error('Reminder title is required.');
        }
        const idx = (data.reminders || []).findIndex((r) => r.id === normalized.id);
        const nextReminders = data.reminders ? data.reminders.slice() : [];
        if (idx >= 0) {
            nextReminders[idx] = Object.assign({}, nextReminders[idx], normalized, {updatedAt: nowIso()});
        } else {
            nextReminders.unshift(normalized);
        }
        const next = writeData(Object.assign({}, data, {reminders: nextReminders}));
        enqueueSync(next, {type: 'reminder.upsert', payload: normalized});
        return normalized;
    }

    function deleteReminder(reminderId) {
        const data = readData();
        const nextReminders = (data.reminders || []).filter((r) => r.id !== reminderId);
        const next = writeData(Object.assign({}, data, {reminders: nextReminders}));
        enqueueSync(next, {type: 'reminder.delete', payload: {id: reminderId}});
    }

    function getSettings() {
        const data = readData();
        return Object.assign({}, defaultData().settings, data.settings || {});
    }

    function updateSettings(patch) {
        const data = readData();
        const nextSettings = Object.assign({}, defaultData().settings, data.settings || {}, patch || {});
        const next = writeData(Object.assign({}, data, {settings: nextSettings}));
        enqueueSync(next, {type: 'settings.update', payload: nextSettings});
        return nextSettings;
    }

    function getCheckin(habitId, date) {
        const data = readData();
        const tz = getSettings().timezone;
        const dateKey = startOfDayIso(date, tz);
        return (data.checkins || []).find((c) => c.habitId === habitId && c.dateKey === dateKey) || null;
    }

    function listCheckinsForDate(date) {
        const data = readData();
        const tz = getSettings().timezone;
        const dateKey = startOfDayIso(date, tz);
        return (data.checkins || []).filter((c) => c.dateKey === dateKey);
    }

    function listCheckinsForHabit(habitId) {
        const data = readData();
        return (data.checkins || []).filter((c) => c.habitId === habitId);
    }

    function upsertCheckin(payload) {
        const data = readData();
        const tz = getSettings().timezone;
        const dateKey = payload.dateKey || startOfDayIso(payload.date || new Date(), tz);
        if (!payload.habitId) {
            throw new Error('habitId is required for a check-in.');
        }
        const normalized = normalizeCheckin(Object.assign({}, payload, {dateKey}));
        const idx = (data.checkins || []).findIndex((c) => c.habitId === normalized.habitId && c.dateKey === normalized.dateKey);
        const nextCheckins = data.checkins ? data.checkins.slice() : [];
        if (idx >= 0) {
            nextCheckins[idx] = Object.assign({}, nextCheckins[idx], normalized, {updatedAt: nowIso()});
        } else {
            nextCheckins.unshift(normalized);
        }
        const next = writeData(Object.assign({}, data, {checkins: nextCheckins}));
        enqueueSync(next, {type: 'checkin.upsert', payload: normalized});
        return normalized;
    }

    function deleteCheckin(checkinId) {
        const data = readData();
        const nextCheckins = (data.checkins || []).filter((c) => c.id !== checkinId);
        const next = writeData(Object.assign({}, data, {checkins: nextCheckins}));
        enqueueSync(next, {type: 'checkin.delete', payload: {id: checkinId}});
    }

    async function syncNow() {
        return trySync(getTokenFn);
    }

    function exportData() {
        const data = readData();
        // Remove sync state from export to keep it user-focused (but keep settings).
        const cleaned = Object.assign({}, data, {sync: Object.assign({}, data.sync, {pending: []})});
        return cleaned;
    }

    function importData(json) {
        const parsed = typeof json === 'string' ? safeParse(json) : json;
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid import payload.');
        }
        const base = defaultData();
        const next = writeData({
            version: base.version,
            meta: Object.assign({}, base.meta, {createdAt: base.meta.createdAt}),
            habits: Array.isArray(parsed.habits) ? parsed.habits.map(normalizeHabit) : [],
            checkins: Array.isArray(parsed.checkins) ? parsed.checkins.map(normalizeCheckin) : [],
            reminders: Array.isArray(parsed.reminders) ? parsed.reminders.map(normalizeReminder) : [],
            settings: Object.assign({}, base.settings, parsed.settings || {}),
            sync: Object.assign({}, base.sync)
        });
        return next;
    }

    return {
        getSnapshot,
        listHabits,
        upsertHabit,
        archiveHabit,
        deleteHabit,
        listReminders,
        upsertReminder,
        deleteReminder,
        getSettings,
        updateSettings,
        getCheckin,
        listCheckinsForDate,
        listCheckinsForHabit,
        upsertCheckin,
        deleteCheckin,
        syncNow,
        exportData,
        importData
    };
}
