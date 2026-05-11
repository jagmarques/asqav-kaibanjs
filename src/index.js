/**
 * Asqav KaibanJS integration. Signs task state transitions to the Asqav API
 * directly without depending on @asqav/sdk. Sends full action context to the
 * configured baseUrl; for client-side hash-only behaviour use @asqav/sdk.
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
      console.warn('Asqav signing failed (fail-open):', err.message);
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
      if (!res.ok) {
        console.warn(`Asqav preflight unavailable (HTTP ${res.status}) - skipping, returning cleared=true`);
        return { cleared: true, explanation: `Preflight unavailable (HTTP ${res.status}), fail-open` };
      }
      return await res.json();
    } catch (err) {
      console.warn('Asqav preflight unavailable - skipping, returning cleared=true:', err.message);
      return { cleared: true, explanation: 'Preflight unavailable, fail-open' };
    }
  }
}

/**
 * Zustand-compatible KaibanJS middleware that signs task status transitions
 * via the Asqav API on every store mutation. See README for a worked example.
 */
function createAsqavMiddleware(client) {
  return (config) => (set, get, api) => config((args) => {
    const prevState = get();
    set(args);
    const nextState = get();

    if (nextState.tasks) {
      for (const task of nextState.tasks) {
        const prevTask = prevState.tasks?.find(t => t.id === task.id);
        if (prevTask && prevTask.status !== task.status) {
          client.sign('task:transition', {
            task_id: task.id,
            from: prevTask.status,
            to: task.status,
            agent: task.agent?.name || 'unknown'
          }).catch(() => {});
        }
      }
    }
  }, get, api);
}

/**
 * Subscribe to a KaibanJS Team store and sign each task status transition.
 * Preferred over createAsqavMiddleware since KaibanJS already wraps its own store.
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
