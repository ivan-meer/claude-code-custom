// ponytail: simple orchestrator. Split into separate process when web GUI lands.
const WebSocket = require('ws');
const { cursorTo } = require('ansi-escapes');
const statusline = require('./statusline');
const log = require('./log');

const WS_URL = process.env.VIBECHAT_WS_URL || 'ws://127.0.0.1:2209';

let ws = null;
let reconnectTimer = null;
let interval = 300; // initial reconnect interval (ms)

function connect() {
  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    process.stdout.write('\x1b[?25l'); // hide cursor
    // Wait for first status_snapshot
    interval = 300;
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.action) {
        case 'event':
          log.add(msg.event);
          break;
        case 'status_snapshot':
          statusline.render(msg.session);
          break;
        case 'log_replay':
          if (msg.events) {
            // Don't replay — events show in real-time
          }
          break;
        case 'config':
          // Rendered as needed per config changes
          break;
      }
    } catch {}
  });

  ws.on('close', () => {
    scheduleReconnect();
  });

  ws.on('error', () => {
    ws.close();
  });
}

function scheduleReconnect() {
  statusline.render({
    status: 'disconnected',
    eventCount: 0,
    currentTool: 'reconnecting...'
  });
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    interval = Math.min(interval * 1.5, 3000);
    connect();
  }, interval);
}

function cleanup() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) ws.close();
  statusline.clear();
  process.stdout.write('\x1b[?25h'); // show cursor
  process.stdout.write('\x1b[0m');   // reset colors
}

// Handle resize — re-render statusline + log
process.stdout.on('resize', () => {
  const { getState } = require('../server/session-state');
  statusline.render(getState());
  log.renderPage();
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', cleanup);

if (require.main === module) {
  // Setup keyboard only when run directly
  log.setupKeyboard();
  connect();
}

module.exports = { connect, cleanup };
