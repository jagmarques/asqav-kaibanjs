<p align="center">
  <a href="https://asqav.com"><img src="https://asqav.com/logo-text-white.png" alt="asqav" width="150"></a>
</p>

# asqav-kaibanjs

Cryptographic audit trails for KaibanJS multi-agent task execution. Signs every task state transition with ML-DSA-65 via the Asqav API.

## Data handling

`asqav-kaibanjs` is a thin client that calls the Asqav API directly. The data sent depends on which deployment you point `baseUrl` at:

- **Asqav cloud (`https://api.asqav.com`):** the cloud applies GDPR-aware data minimization on its side, retaining only the metadata bag (action_type, agent_id, session_id, model_name, tool_name) and storing a hash of the rest where possible.
- **Self-hosted:** the full action context lands on the server you control, enabling policy checks, PII redaction, and richer audit views.

If you want client-side hash-only behavior with auto-detection (so raw context never leaves your infrastructure when targeting cloud), use the `@asqav/sdk` package directly alongside this integration:

```javascript
import { init } from '@asqav/sdk';

await init({ apiKey: 'sk_...', baseUrl: 'https://api.asqav.com', mode: 'hash-only' });
```

See `docs/canonicalization.md` in the SDK repo for the canonicalization spec and conformance vectors.

## Install

```
npm install asqav-kaibanjs
```

## Quick start

```js
const { Agent, Task, Team } = require('kaibanjs');
const { AsqavClient, subscribeToTeam } = require('asqav-kaibanjs');

// Initialize Asqav client
const client = new AsqavClient({ apiKey: 'sk_...', agentName: 'my-crew' });
await client.init();

// Set up your KaibanJS team
const team = new Team({
  name: 'Research Team',
  agents: [researcher],
  tasks: [researchTask],
  env: { OPENAI_API_KEY: process.env.OPENAI_API_KEY }
});

// Subscribe to task transitions - every status change gets signed
subscribeToTeam(team, client);

// Run the workflow
await team.start();
```

## How it works

KaibanJS manages agent workflows through a Zustand store with task status transitions (TODO -> DOING -> DONE). The `subscribeToTeam` function hooks into the store's `subscribeWithSelector` middleware to watch for task status changes.

When a task status changes, it calls the Asqav API to sign the transition. The signing happens server-side with ML-DSA-65 (quantum-safe, FIPS 204). The agent never holds the signing key.

Signing is fail-open. If the API is unreachable, your KaibanJS workflow continues without interruption.

## Advanced: Zustand middleware

If you need lower-level control, use `createAsqavMiddleware` directly with a Zustand store:

```js
const { createAsqavMiddleware } = require('asqav-kaibanjs');
const { create } = require('zustand');

const store = create(
  createAsqavMiddleware(client)((set) => ({
    tasks: [],
    // your store config
  }))
);
```

## Manual signing

```js
// Sign any action
const receipt = await client.sign('task:complete', { task_id: '123', result: 'done' });

// Preflight check before destructive actions
const check = await client.preflight('data:delete');
if (check.cleared) {
  // proceed
}
```

## License

MIT
