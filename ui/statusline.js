// ponytail: ANSI statusline. Add multi-line when >2 status slots needed.
const { cursorTo, eraseLine } = require('ansi-escapes');
const config = require('../config');

let lastLine = '';
let state = { status: 'idle' };

const STATUS_INDICATORS = {
  idle: '○',
  thinking: '◌',
  executing: '▶',
  waiting_permission: '?'
};

const FILTER_SHORTHAND = {
  ToolUse:'T', ThinkingBlock:'B', SubagentSpawn:'S',
  TokenCount:'K', Timing:'⏱', ModelSwitch:'M',
  PermissionRequest:'P', MessageDisplay:'D'
};

function render(newState) {
  Object.assign(state, newState);

  const parts = [];

  // Status indicator
  const icon = STATUS_INDICATORS[state.status] || '○';
  parts.push(`${icon} ${state.status}`);

  // Current tool
  if (state.currentTool) parts.push(`[Tool:${state.currentTool}]`);

  // Current subagent
  if (state.currentSubagent) parts.push(`[Sub:${state.currentSubagent}]`);

  // Model
  if (state.model) parts.push(`[${state.model}]`);

  // Event count
  if (state.eventCount) parts.push(`#${state.eventCount}`);

  // Filter indicators: short names + check/cross
  const filters = config.getAll().filters;
  const filterStr = Object.entries(FILTER_SHORTHAND)
    .map(([type, short]) => filters[type] !== false ? `${short}:✓` : `${short}:✗`)
    .join(' ');
  parts.push(`[${filterStr}]`);

  const line = parts.join(' ') + ' ';
  if (line === lastLine) return;
  lastLine = line;

  // Save cursor, go to bottom, clear, draw, restore
  process.stdout.write(
    '\x1b7' +          // save cursor
    cursorTo(0, process.stdout.rows - 1) +
    eraseLine +
    line +
    '\x1b8'            // restore cursor
  );
}

function clear() {
  lastLine = '';
  process.stdout.write(
    '\x1b7' +
    cursorTo(0, process.stdout.rows - 1) +
    eraseLine +
    '\x1b8'
  );
}

module.exports = { render, clear };
