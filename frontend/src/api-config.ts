const hostname = window.location.hostname;
const protocol = window.location.protocol;
const isVercel = hostname.includes('vercel.app');
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

// 1. Env variable takes priority (e.g. VITE_API_URL set in Vercel dashboard)
// 2. If on Vercel, assume same origin but check if we need an absolute URL
// 3. If local or network IP, use port 8888
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 
    (isVercel ? `${protocol}//${hostname}` : `${protocol}//${hostname}:8888`);

export default API_BASE_URL;
