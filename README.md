# rain-garden-birthday

手机优先的静态网页解谜生日礼物游戏。

## Local Preview

```bash
python3 -m http.server 5173
```

Open `http://localhost:5173`.

## Tests

```bash
node --test tests/state.test.mjs
```

## Design

See `docs/superpowers/specs/2026-07-02-rain-garden-birthday-design.md`.

## Deployment

This app is static. Deploy the whole folder to any static host such as Vercel, Netlify, GitHub Pages, or another static web service.

Birthday-day checklist:

- Test the hosted URL on the recipient's phone.
- Place physical gifts indoors.
- Place the `future` entry clue near the courtyard or pond only if it is waterproof.
- Keep a private fallback note with all three final gift instructions.
