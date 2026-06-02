import {getEnv} from '../config/env';

/**
 * A very small fetch wrapper that:
 * - prefixes requests with REACT_APP_API_BASE
 * - attaches Authorization header if token is provided
 * - normalizes errors
 */

// PUBLIC_INTERFACE
export class ApiError extends Error {
    /** Represents an HTTP error from the API. */
    constructor(message, status, details) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

// PUBLIC_INTERFACE
export function createApiClient(getTokenFn) {
    /**
     * Creates an API client bound to an auth token accessor.
     * @param {function(): (string|null)} getTokenFn Function returning the current access token.
     * @return {{get: function(string, Object=): Promise<any>, post: function(string, any, Object=): Promise<any>, put: function(string, any, Object=): Promise<any>, del: function(string, Object=): Promise<any>}}
     */
    const {apiBase} = getEnv();

    async function request(path, options) {
        const url = `${apiBase}${path}`;
        const token = getTokenFn ? getTokenFn() : null;

        const headers = Object.assign(
            {'Accept': 'application/json'},
            options && options.headers ? options.headers : {}
        );

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const resp = await fetch(url, Object.assign({}, options, {headers}));

        const contentType = resp.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        let payload = null;
        if (resp.status !== 204) {
            payload = isJson ? await resp.json().catch(() => null) : await resp.text().catch(() => null);
        }

        if (!resp.ok) {
            const msg =
                (payload && payload.message) ||
                `Request failed with status ${resp.status}`;
            throw new ApiError(msg, resp.status, payload);
        }

        return payload;
    }

    async function get(path, options) {
        return request(path, Object.assign({}, options, {method: 'GET'}));
    }

    async function post(path, body, options) {
        const headers = Object.assign({'Content-Type': 'application/json'}, (options && options.headers) || {});
        return request(
            path,
            Object.assign({}, options, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            })
        );
    }

    async function put(path, body, options) {
        const headers = Object.assign({'Content-Type': 'application/json'}, (options && options.headers) || {});
        return request(
            path,
            Object.assign({}, options, {
                method: 'PUT',
                headers,
                body: JSON.stringify(body)
            })
        );
    }

    async function del(path, options) {
        return request(path, Object.assign({}, options, {method: 'DELETE'}));
    }

    return {get, post, put, del};
}
