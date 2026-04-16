const { describe, it } = require('node:test');
const assert = require('node:assert');
const { AsqavClient, createAsqavMiddleware, subscribeToTeam } = require('./index');

describe('AsqavClient', () => {
  it('should initialize with defaults', () => {
    const client = new AsqavClient({ apiKey: 'sk_test' });
    assert.strictEqual(client.apiKey, 'sk_test');
    assert.strictEqual(client.baseUrl, 'https://api.asqav.com/api/v1');
    assert.strictEqual(client.agentName, 'kaibanjs-agent');
    assert.strictEqual(client.agentId, null);
  });

  it('should accept custom baseUrl and agentName', () => {
    const client = new AsqavClient({
      apiKey: 'sk_test',
      baseUrl: 'http://localhost:8000/api/v1',
      agentName: 'my-crew'
    });
    assert.strictEqual(client.baseUrl, 'http://localhost:8000/api/v1');
    assert.strictEqual(client.agentName, 'my-crew');
  });

  it('should fall back to ASQAV_API_KEY env var', () => {
    process.env.ASQAV_API_KEY = 'sk_env_test';
    const client = new AsqavClient({});
    assert.strictEqual(client.apiKey, 'sk_env_test');
    delete process.env.ASQAV_API_KEY;
  });
});

describe('createAsqavMiddleware', () => {
  it('should return a function', () => {
    const client = new AsqavClient({ apiKey: 'sk_test' });
    const middleware = createAsqavMiddleware(client);
    assert.strictEqual(typeof middleware, 'function');
  });
});

describe('subscribeToTeam', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof subscribeToTeam, 'function');
  });
});
