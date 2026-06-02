import '@testing-library/jest-dom';

// JSDOM does not implement several browser APIs used by the app. Provide minimal
// stubs so tests can focus on UI behavior rather than environment gaps.
Object.assign(global, {
    // Used by ExportPage download flow.
    URL: Object.assign(global.URL || {}, {
        createObjectURL: global.URL && global.URL.createObjectURL ? global.URL.createObjectURL : jest.fn(() => 'blob:mock'),
        revokeObjectURL: global.URL && global.URL.revokeObjectURL ? global.URL.revokeObjectURL : jest.fn()
    })
});

if (!global.navigator.clipboard) {
    global.navigator.clipboard = {
        writeText: jest.fn(() => Promise.resolve())
    };
}

// Default dialog mocks; individual tests can override return values.
if (!global.confirm) {
    global.confirm = jest.fn(() => true);
}
if (!global.prompt) {
    global.prompt = jest.fn(() => '');
}
