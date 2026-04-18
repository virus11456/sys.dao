# sys.dao

Cyber daily operating system — a React-based daily practice / habit tracker app.

Built with Vite + React 18. Deployed on Vercel.

## Local dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # -> dist/
npm run preview
```

## Notes

- Storage is currently `localStorage` (per-browser). To add cross-device sync, swap the `storage` helper in `src/App.jsx` for a backend (Supabase, Vercel KV, etc.).
- The original file was `cyber_dao_v6.jsx` written against a Claude artifact storage API. It has been adapted for browser-native localStorage so it can run standalone on Vercel.
