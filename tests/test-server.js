// Self-check test: starts server, sends test events, verifies WS broadcast
const http = require('http');
const { strict: assert } = require('assert');
const WebSocket = require('ws');

const PORT = 2210;
const HOST = '127.0.0.1';

const { server } = require('../server/index');

let pass = 0;
let fail = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    pass++;
  } catch (err) {
    console.error(`FAIL: ${name} - ${err.message}`);
    fail++;
  }
}

function postEvent(event) {
  return new Promise(resolve => {
    const body = JSON.stringify(event);
    const req = http.request({
      hostname: HOST, port: PORT, path: '/event', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.write(body);
    req.end();
  });
}

function wsConnect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://${HOST}:${PORT}`);
    const msgs = [];
    // Register BEFORE open — server sends init messages immediately on connect
    ws.on('message', raw => msgs.push(JSON.parse(raw.toString())));
    ws.on('open', () => resolve({ ws, msgs }));
    ws.on('error', reject);
    setTimeout(() => reject(new Error('ws timeout')), 3000);
  });
}

async function run() {
  console.log('=== VibeChat Server Self-Check ===\n');

  // Start server
  await new Promise((resolve, reject) => {
    server.listen(PORT, HOST, () => resolve());
    server.on('error', reject);
  });
  console.log(`Server started on ${HOST}:${PORT}`);

  // Test 1: GET /health
  const healthBody = await new Promise(resolve => {
    http.get(`http://${HOST}:${PORT}/health`, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });
  check('GET /health returns status ok', () => assert.equal(healthBody.status, 'ok'));
  check('GET /health has clients count', () => assert('clients' in healthBody));

  // Test 2: POST /event valid
  const r1 = await postEvent({ type: 'ThinkingBlock', data: { content: 'test' } });
  check('POST /event returns ok', () => assert.equal(r1.ok, true));

  // Test 3: POST binary garbage
  await new Promise(resolve => {
    const bad = Buffer.from([255, 254, 0, 1]);
    const req = http.request({
      hostname: HOST, port: PORT, path: '/event', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': bad.length }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const body = JSON.parse(d);
        check('POST /event rejects binary data', () => assert.equal(body.ok, false));
        resolve();
      });
    });
    req.write(bad);
    req.end();
  });

  // Test 4: POST /event missing type
  const r3 = await postEvent({ data: {} });
  check('POST /event rejects missing type', () => assert.equal(r3.ok, false));

  // Test 5: GET /config
  const configBody = await new Promise(resolve => {
    http.get(`http://${HOST}:${PORT}/config`, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });
  check('GET /config has filters', () => assert('filters' in configBody));
  check('GET /config ToolUse=true', () => assert.equal(configBody.filters.ToolUse, true));

  // Test 6: WS init messages arrive on connect (listener registered before open)
  const { ws: ws1, msgs: initMsgs } = await wsConnect();
  ws1.close();

  const hasSnapshot = initMsgs.some(m => m.action === 'status_snapshot');
  const hasLog = initMsgs.some(m => m.action === 'log_replay');
  const hasConfig = initMsgs.some(m => m.action === 'config');
  check('WS init has status_snapshot', () => assert(hasSnapshot, `got: ${initMsgs.map(m=>m.action).join(',')}`));
  check('WS init has log_replay', () => assert(hasLog));
  check('WS init has config', () => assert(hasConfig));

  // Test 7: WS receives broadcast when event posted
  const { ws: ws2 } = await wsConnect();
  // catch broadcast events after init
  const evtMsgs = [];
  ws2.on('message', raw => {
    const msg = JSON.parse(raw.toString());
    if (msg.action === 'event') evtMsgs.push(msg);
  });
  await new Promise(r => setTimeout(r, 300));
  await postEvent({ type: 'ThinkingBlock', data: { content: 'broadcast-test' } });
  await new Promise(r => setTimeout(r, 1000));
  ws2.close();

  const gotBc = evtMsgs.some(m => m.event?.type === 'ThinkingBlock' && m.event?.data?.content === 'broadcast-test');
  check('WS receives broadcast event', () => assert(gotBc));

  // Test 8: POST /config update
  await new Promise(resolve => {
    const body = JSON.stringify({ filters: { ToolUse: false } });
    const req = http.request({
      hostname: HOST, port: PORT, path: '/config', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const cfg = JSON.parse(d);
        check('POST /config updates filters', () => assert.equal(cfg.config.filters.ToolUse, false));
        resolve();
      });
    });
    req.write(body);
    req.end();
  });

  // Report
  console.log(`\n=== Results: ${pass} passed, ${fail} failed ===`);
  // Restore config
  postEvent({ type: 'ThinkingBlock', data: {} });
  server.close();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => {
  console.log('Harness error:', err);
  process.exit(1);
});
