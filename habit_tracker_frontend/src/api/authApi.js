import {createApiClient} from './apiClient';

/**
 * Auth endpoint paths are placeholders until the backend contract is confirmed.
 * This layer isolates the rest of the UI from endpoint changes.
 */

// PUBLIC_INTERFACE
export function createAuthApi(getTokenFn) {
    /**
     * Creates an auth API binding.
     * @param {function(): (string|null)} getTokenFn
     * @return {{login: function(string,string): Promise<Object>, register: function(Object): Promise<Object>, me: function(): Promise<Object>}}
     */
    const client = createApiClient(getTokenFn);

    async function login(email, password) {
        return client.post('/auth/login', {email, password});
    }

    async function register(payload) {
        return client.post('/auth/register', payload);
    }

    async function me() {
        return client.get('/auth/me');
    }

    return {login, register, me};
}
