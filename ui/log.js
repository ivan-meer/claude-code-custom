// ponytail: in-memory log + ANSI scroll. Add search when >100 queries/day.
const { cursorUp, cursorDown, eraseDown } = require('ansi-escapes');

const MAX_ENTRIES = 2000;
let entries = [];
let scrollOffset = 0; // how far scrolled back (0 = bottom)
let logHeight = 10;   // lines reserved for log (term rows - statusline)

// Truncate string to fit terminal width
function fit(str, width) {
  if (str.length > width) return str.slice(0, width - 1) + '…';
  return str;
}

function add(event) {
  entries.push(event);
  if (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
  if (scrollOffset === 0) {
    // At bottom — auto-scroll to show latest
    renderNewest(event);
  }
}

function renderNewest(event) {
  const icon = typeIcon(event.type);
  const ts = new Date(event.timestamp).toLocaleTimeString();
  const width = process.stdout.columns || 80;
  const desc = describe(event);

  const line = fit(`${icon} ${ts} ${event.type} › ${desc}`, width);

  // Save cursor, position above statusline, write one line
  process.stdout.write(
    '\x1b7' +                     // save cursor
    `\x1b[${process.stdout.rows - 2};0H` +  // line above statusline
    eraseDown +
    line + '\n' +
    '\x1b8'                       // restore cursor
  );

  // Scroll the previous line upward naturally
  entries.slice(-2, -1).forEach(e => {
    // The terminal handles natural scroll for lines above
  });
}

function renderPage() {
  const rows = process.stdout.rows || 24;
  logHeight = Math.max(3, rows - 2); // reserve 2 lines for statusline

  const width = process.stdout.columns || 80;
  const visible = entries.slice(
    Math.max(0, entries.length - logHeight - scrollOffset),
    entries.length - scrollOffset
  ).slice(-logHeight);

  // Position cursor to log area start
  process.stdout.write(cursorTo(0, rows - logHeight - 2) + eraseDown);

  for (const event of visible) {
    const icon = typeIcon(event.type);
    const ts = new Date(event.timestamp).toLocaleTimeString();
    const desc = describe(event);
    process.stdout.write(fit(`${icon} ${ts} ${event.type} › ${desc}\n`, width));
  }
}

function describe(event) {
  switch (event.type) {
    case 'ToolUse': return `${event.data.tool_name} ${event.data.tool_input || ''}`;
    case 'ThinkingBlock': return event.data.content || '';
    case 'SubagentSpawn': return `${event.data.agent_name} ${event.data.action}`;
    case 'TokenCount': return `${event.data.tokens_in || 0}↑ ${event.data.tokens_out || 0}↓ (${event.data.total || 0} total)`;
    case 'Timing': return `${event.data.duration_ms || 0}ms ${event.data.action || ''}`;
    case 'ModelSwitch': return `${event.data.from_model || '?'} → ${event.data.to_model}`;
    case 'PermissionRequest': return `allow ${event.data.tool_name}? ${event.data.decision || 'pending'}`;
    case 'MessageDisplay': return event.data.text || event.data.chunk || '';
    default: return '';
  }
}

function typeIcon(type) {
  const icons = {
    ToolUse: '🔧', ThinkingBlock: '💭', SubagentSpawn: '🤖',
    TokenCount: '📊', Timing: '⏱️', ModelSwitch: '🔄',
    PermissionRequest: '🔑', MessageDisplay: '💬'
  };
  return icons[type] || '📌';
}

function scrollUp(n = 1) {
  const maxOffset = Math.max(0, entries.length - logHeight);
  scrollOffset = Math.min(scrollOffset + n, maxOffset);
  renderPage();
}

function scrollDown(n = 1) {
  scrollOffset = Math.max(0, scrollOffset - n);
  renderPage();
}

function clear() {
  entries = [];
  scrollOffset = 0;
  renderPage();
}

// Handle keyboard input
function setupKeyboard() {
  const stdin = process.stdin;
  if (!stdin.setRawMode) { return; }

  stdin.setRawMode(true);
  stdin.on('data', (buf) => {
    const key = buf.toString();
    if (key === '\x1b[A' || key === 'k' || buf[0] === 11) { scrollUp(1); }     // Up arrow / k / Ctrl-K
    else if (key === '\x1b[B' || key === 'j' || buf[0] === 10) { scrollDown(1); } // Down / j / Ctrl-J
    else if (key === '\x1b[5~') { scrollUp(logHeight); }                          // PgUp
    else if (key === '\x1b[6~') { scrollDown(logHeight); }                        // PgDn
    else if (key === 'q' || buf[0] === 3) {
      // 'q' or Ctrl-C
      stdin.setRawMode(false);
      process.stdout.write('\x1b[?25h'); // show cursor
    }
  });
}

module.exports = { add, clear, setupKeyboard, scrollUp, scrollDown };
