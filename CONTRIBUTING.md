# Contributing to PromptVoice Studio

## Development Setup

```bash
git clone https://github.com/joseph19993d/PromptVoice-Studio-D.git
cd PromptVoice-Studio-D
npm install
npm run dev
```

## Project Structure

- `src/core/` — Business logic (providers, managers, types). No Electron/React deps.
- `src/main/` — Electron main process + IPC handlers
- `src/preload/` — contextBridge API (typed)
- `src/renderer/` — React UI (components, hooks, store)

## Adding a Provider

1. Implement the interface (`IAIProvider`, `ITTSProvider`, or `ISTTProvider`) in `src/core/<service>/providers/`
2. Register in the corresponding Manager's factory method
3. Add type to `src/core/types.ts`
4. Add dropdown option in `src/renderer/src/components/SettingsPage.tsx`

## Coding Conventions

- **TypeScript** strict mode for all files
- **Vanilla CSS** — no CSS frameworks
- **Zustand** for state — keep the store flat
- **IPC responses** always use `{ success, data, error }` wrapper
- **No direct API calls** from the renderer — everything goes through `window.api`

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Electron dev with HMR |
| `npm run build` | Build for production |
| `npm run typecheck` | Run TypeScript type checking |

## Pull Requests

1. Fork → branch → commit → PR
2. Follow existing code style
3. Test with `npm run dev` before submitting
