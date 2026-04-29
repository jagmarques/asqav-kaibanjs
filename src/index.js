/**
 * Asqav KaibanJS integration - signs task state transitions with cryptographic audit trails.
 * Calls the Asqav API directly. No SDK dependency.
 *
 * Data handling note: this thin client currently sends the full action context
 * (task ids, status transitions, agent name) to the configured baseUrl. When you
 * point baseUrl at *.asqav.com, the cloud applies its own server-side controls.
 * For client-side hash-only behavior matching the @asqav/sdk auto-detection,
 * use @asqav/sdk directly: init({ apiKey, baseUrl, mode: 'hash-only' }). See
 * docs/canonicalization.md in the SDK repo for the canonicalization spec.
 */

class AsqavClient {
  constructor({ apiKey, baseUrl = 'https://api.asqav.com/api/v1', agentName }) {
    this.apiKey = apiKey || process.env.ASQAV_API_KEY;
    this.baseUrl = baseUrl;
    this.agentId = null;
    this.agentName = agentName || 'kaibanjs-agent';
  }

  async init() {
    const res = await fetch(`${this.baseUrl}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
      body: JSON.stringify({ name: this.agentName })
    });
    const data = await res.json();
    this.agentId = data.agent_id;
    return this;
  }

  async sign(actionType, context = {}) {
    try {
      const res = await fetch(`${this.baseUrl}/agents/${this.agentId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
        body: JSON.stringify({ action_type: actionType, context })
      });
      return await res.json();
    } catch (err) {
      console.warn('asqav signing failed (fail-open):', err.message);
      return null;
    }
  }

  async preflight(actionType) {
    try {
      const res = await fetch(`${this.baseUrl}/agents/${this.agentId}/preflight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
        body: JSON.stringify({ action_type: actionType })
      });
      return await res.json();
    } catch (err) {
      console.warn('asqav preflight failed (fail-open):', err.message);
      return { cleared: true, explanation: 'Preflight unavailable, fail-open' };
    }
  }
}

/**
 * KaibanJS store middleware for Asqav audit trails.
 *
 * KaibanJS uses Zustand for state management. This middleware wraps the store's
 * state creator to intercept mutations and sign task status transitions via the
 * Asqav API. Compatible with Zustand's middleware composition pattern used by
 * KaibanJS (devtools, subscribeWithSelector).
 *
 * Usage with a KaibanJS Team's store:
 *   const team = new Team({ ... });
 *   const store = team.useStore();
 *   store.subscribe(
 *     (state) => state.tasks,
 *     (tasks, prevTasks) => {
 *       for (const task of tasks) {
 *         const prev = prevTasks.find(t => t.id === task.id);
 *         if (prev && prev.status !== task.status) {
 *           client.sign('task:transition', {
 *             task_id: task.id,
 *             from: prev.status,
 *             to: task.status,
 *             agent: task.agent?.name || 'unknown'
 *           });
 *         }
 *       }
 *     }
 *   );
 */
function createAsqavMiddleware(client) {
  return (config) => (set, get, api) => config((args) => {
    const prevState = get();
    set(args);
    const nextState = get();

    // Sign task status transitions
    if (nextState.tasks) {
      for (const task of nextState.tasks) {
        const prevTask = prevState.tasks?.find(t => t.id === task.id);
        if (prevTask && prevTask.status !== task.status) {
          client.sign('task:transition', {
            task_id: task.id,
            from: prevTask.status,
            to: task.status,
            agent: task.agent?.name || 'unknown'
          }).catch(() => {}); // fail-open
        }
      }
    }
  }, get, api);
}

/**
 * Subscribe to a KaibanJS Team store to sign task transitions.
 * This is the recommended approach since KaibanJS already creates its own
 * Zustand store internally via subscribeWithSelector middleware.
 *
 * Usage:
 *   const team = new Team({ ... });
 *   const client = new AsqavClient({ apiKey: 'sk_...' });
 *   await client.init();
 *   subscribeToTeam(team, client);
 *   await team.start();
 */
function subscribeToTeam(team, client) {
  const store = team.useStore();
  store.subscribe(
    (state) => state.tasks,
    (tasks, prevTasks) => {
      if (!tasks || !prevTasks) return;
      for (const task of tasks) {
        const prev = prevTasks.find(t => t.id === task.id);
        if (prev && prev.status !== task.status) {
          client.sign('task:transition', {
            task_id: task.id,
            from: prev.status,
            to: task.status,
            agent: task.agent?.name || 'unknown'
          }).catch(() => {});
        }
      }
    }
  );
}

module.exports = { AsqavClient, createAsqavMiddleware, subscribeToTeam };
