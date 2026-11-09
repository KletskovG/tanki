export const HTTP_ENDPOINT = {
    CLEAR: 'clear',
    NEW: 'new',
    GAMES: 'games',
};

export const API_URL = new URL(
    import.meta.env['VITE_API_URL'] || (import.meta.env.DEV ? '/api' : 'https://51.250.87.166'),
    window.location.origin,
).href.replace(/\/$/, '');

export const CONTROLS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space']);
