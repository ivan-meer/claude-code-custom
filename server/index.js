// ponytail: single-file WS server. Split into modules when >300 lines.
const http = require('http');
const { WebSocketServer } = require('ws');
const { getState, updateState } = require('./session-state');
const config = require('../config');
const { isEnabled } = config;

const PORT = 2209;
const HOST = '127.0.0.1';

// Rolling event log (in-memory, max 2000 entries)
const MAX_LOG = 2000;
const logBuffer = [];
const wsClients = new Set();

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const ws of wsClients) {
    if (ws.readyState === 1) ws.send(data);
  }
}

function addLog(event) {
  logBuffer.push(event);
  if (logBuffer.length > MAX_LOG) logBuffer.shift();
}

// HTTP handler
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // GET /health
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', clients: wsClients.size, events: logBuffer.length }));
  }

  // POST /event — hooks fire events here
  if (req.method === 'POST' && req.url === '/event') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        if (!event.type || !event.data) throw new Error('Missing type or data');

        event.id = event.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        event.timestamp = event.timestamp || new Date().toISOString();
        event.source = event.source || 'external';

        updateState(event);
        addLog(event);

        // Broadcast to all UI clients (filtered)
        if (isEnabled(event.type)) {
          broadcast({ action: 'event', event });
        }
        broadcast({ action: 'status_snapshot', session: getState() });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // POST /config — update filter config
  if (req.method === 'POST' && req.url === '/config') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newConfig = JSON.parse(body);
        config.update(newConfig);
        broadcast({ action: 'config', config: config.getAll() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, config: config.getAll() }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // GET /config
  if (req.method === 'GET' && req.url === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(config.getAll()));
  }

  res.writeHead(404);
  res.end('Not found');
});

// WebSocket upgrade
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  wsClients.add(ws);

  // Send state snapshot + log replay on connect
  safeSend(ws, { action: 'status_snapshot', session: getState() });
  safeSend(ws, { action: 'log_replay', events: logBuffer });
  safeSend(ws, { action: 'config', config: config.getAll() });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.action === 'get_config') {
        safeSend(ws, { action: 'config', config: config.getAll() });
      }
    } catch {}
  });

  ws.on('close', () => wsClients.delete(ws));
  ws.on('error', () => wsClients.delete(ws));
});

function safeSend(ws, msg) {
  try {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
  } catch {}
}

// Graceful shutdown
process.on('SIGINT', () => {
  for (const ws of wsClients) ws.close();
  wss.close();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => process.exit(0));

// Only start if called directly (not required)
if (require.main === module) {
  server.listen(PORT, HOST, () => {
    process.stdout.write(`VibeChat WS on ws://${HOST}:${PORT}\n`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      process.stderr.write(`Port ${PORT} in use. Is VibeChat already running?\n`);
      process.exit(1);
    }
    throw err;
  });
}

module.exports = { server, broadcast, addLog, logBuffer };
