// ponytail: simple state machine. Add EventEmitter when >2 consumers.
const VALID_STATUSES = ['idle', 'thinking', 'executing', 'waiting_permission'];

let state = {
  currentTool: null,
  currentSubagent: null,
  lastThought: null,
  status: 'idle',
  model: null,
  sessionStart: new Date().toISOString(),
  eventCount: 0
};

function getState() {
  return { ...state };
}

function updateState(event) {
  state.eventCount++;

  switch (event.type) {
    case 'ToolUse':
      if (event.data.state === 'start') {
        state.status = 'executing';
        state.currentTool = event.data.tool_name;
      } else {
        state.status = 'idle';
        state.currentTool = null;
      }
      break;

    case 'ThinkingBlock':
      state.status = 'thinking';
      state.lastThought = event.data.content;
      break;

    case 'SubagentSpawn':
      if (event.data.action === 'start') {
        state.currentSubagent = event.data.agent_name;
      } else {
        state.currentSubagent = null;
      }
      break;

    case 'ModelSwitch':
      state.model = event.data.to_model;
      break;

    case 'PermissionRequest':
      state.status = 'waiting_permission';
      break;

    case 'Timing':
      state.status = 'idle';
      break;

    case 'MessageDisplay':
      // MessageDisplay doesn't change agent state
      break;

    default:
      break;
  }

  return getState();
}

// Reset state for new session
function reset() {
  state = {
    currentTool: null,
    currentSubagent: null,
    lastThought: null,
    status: 'idle',
    model: null,
    sessionStart: new Date().toISOString(),
    eventCount: 0
  };
  return getState();
}

module.exports = { getState, updateState, reset, VALID_STATUSES };
