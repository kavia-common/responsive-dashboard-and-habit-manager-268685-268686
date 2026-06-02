import React, {createContext, useContext, useMemo, useReducer} from 'react';

import {useAuth} from '../auth/AuthContext';
import {createLocalStore} from './localStore';

const DataContext = createContext(null);

function reducer(state, action) {
    switch (action.type) {
        case 'refresh': {
            return Object.assign({}, state, {rev: state.rev + 1});
        }
        default:
            return state;
    }
}

// PUBLIC_INTERFACE
export function DataProvider({children}) {
    /** Provides local-first habit tracker data state and actions to the app. */
    const auth = useAuth();
    const [state, dispatch] = useReducer(reducer, {rev: 0});

    const store = useMemo(() => {
        return createLocalStore(() => auth.token);
    }, [auth.token]);

    const api = useMemo(() => {
        function refresh() {
            dispatch({type: 'refresh'});
        }

        function safeCall(fn) {
            try {
                const v = fn();
                refresh();
                return v;
            } catch (e) {
                throw e;
            }
        }

        async function safeCallAsync(fn) {
            try {
                const v = await fn();
                refresh();
                return v;
            } catch (e) {
                throw e;
            }
        }

        return {
            // snapshot + selectors
            getSnapshot: () => store.getSnapshot(),
            listHabits: (opts) => store.listHabits(opts),
            listReminders: () => store.listReminders(),
            getSettings: () => store.getSettings(),
            listCheckinsForDate: (date) => store.listCheckinsForDate(date),
            listCheckinsForHabit: (habitId) => store.listCheckinsForHabit(habitId),
            getCheckin: (habitId, date) => store.getCheckin(habitId, date),

            // commands
            upsertHabit: (h) => safeCall(() => store.upsertHabit(h)),
            archiveHabit: (id) => safeCall(() => store.archiveHabit(id)),
            deleteHabit: (id) => safeCall(() => store.deleteHabit(id)),

            upsertReminder: (r) => safeCall(() => store.upsertReminder(r)),
            deleteReminder: (id) => safeCall(() => store.deleteReminder(id)),

            updateSettings: (p) => safeCall(() => store.updateSettings(p)),

            upsertCheckin: (c) => safeCall(() => store.upsertCheckin(c)),
            deleteCheckin: (id) => safeCall(() => store.deleteCheckin(id)),

            // sync + import/export
            syncNow: () => safeCallAsync(() => store.syncNow()),
            exportData: () => store.exportData(),
            importData: (json) => safeCall(() => store.importData(json))
        };
    }, [store, state.rev]);

    return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

// PUBLIC_INTERFACE
export function useData() {
    /** Hook to access the habit tracker data layer. */
    const ctx = useContext(DataContext);
    if (!ctx) {
        throw new Error('useData must be used within a DataProvider.');
    }
    return ctx;
}
