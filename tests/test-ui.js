// Self-check test: sends AgentEvents, verifies statusline state transitions
const { strict: assert } = require('assert');
const sessionState = require('../server/session-state');

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

console.log('=== VibeChat UI / Session State Self-Check ===\n');

// Reset state before tests
sessionState.reset();

// Test state transitions
const s1 = sessionState.updateState({ type: 'ThinkingBlock', data: { content: 'I am analyzing...' } });
check('ThinkingBlock sets status=thinking', () => assert.equal(s1.status, 'thinking'));
check('ThinkingBlock sets lastThought', () => assert.equal(s1.lastThought, 'I am analyzing...'));

const s2 = sessionState.updateState({ type: 'ToolUse', data: { tool_name: 'Bash', tool_input: 'ls', state: 'start' } });
check('ToolUse start sets status=executing', () => assert.equal(s2.status, 'executing'));

const s3 = sessionState.updateState({ type: 'PermissionRequest', data: { tool_name: 'Bash', args: 'rm -rf', decision: 'pending' } });
check('PermissionRequest sets status=waiting_permission', () => assert.equal(s3.status, 'waiting_permission'));

const s4 = sessionState.updateState({ type: 'ModelSwitch', data: { from_model: 'sonnet', to_model: 'opus', reason: 'complex' } });
check('ModelSwitch updates model', () => assert.equal(s4.model, 'opus'));

const s5 = sessionState.updateState({ type: 'SubagentSpawn', data: { agent_name: 'explorer', action: 'start' } });
check('SubagentSpawn start sets currentSubagent', () => assert.equal(s5.currentSubagent, 'explorer'));

const s6 = sessionState.updateState({ type: 'SubagentSpawn', data: { agent_name: 'explorer', action: 'end' } });
check('SubagentSpawn end clears currentSubagent', () => assert.equal(s6.currentSubagent, null));

const s7 = sessionState.updateState({ type: 'ToolUse', data: { tool_name: 'Bash', state: 'end' } });
check('ToolUse end sets status=idle', () => assert.equal(s7.status, 'idle'));

// Event count increment
check('Event count incremented', () => assert(s7.eventCount >= 7));

// Reset test
const reset = sessionState.reset();
check('Reset clears all state', () => {
  assert.equal(reset.status, 'idle');
  assert.equal(reset.currentTool, null);
  assert.equal(reset.currentSubagent, null);
  assert.equal(reset.lastThought, null);
  assert.equal(reset.model, null);
  assert.equal(reset.eventCount, 0);
});

// Unknown event type doesn't crash
const safe = sessionState.updateState({ type: 'UnknownEvent', data: {} });
check('Unknown event type handled safely', () => assert.equal(safe.status, 'idle'));

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
