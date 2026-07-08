// ponytail: JSON file config. Add YAML/TOML support when needed beyond filters.
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.vibechat.json');

const KNOWN_EVENT_TYPES = [
  'ToolUse', 'ThinkingBlock', 'SubagentSpawn',
  'TokenCount', 'Timing', 'ModelSwitch', 'PermissionRequest', 'MessageDisplay'
];

const DEFAULT_CONFIG = {
  filters: Object.fromEntries(KNOWN_EVENT_TYPES.map(t => [t, true])),
  display: {
    statuslineLines: 1,
    maxLogEntries: 2000
  }
};

let config = { ...DEFAULT_CONFIG, filters: { ...DEFAULT_CONFIG.filters } };

function load() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      // Merge with defaults (don't lose new filter types)
      config.filters = { ...DEFAULT_CONFIG.filters, ...(parsed.filters || {}) };
      config.display = { ...DEFAULT_CONFIG.display, ...(parsed.display || {}) };
    }
  } catch {
    // Use defaults on any error
  }
  return config;
}

function getAll() {
  return {
    filters: { ...config.filters },
    display: { ...config.display }
  };
}

function update(newConfig) {
  if (newConfig.filters) {
    for (const key of Object.keys(newConfig.filters)) {
      if (KNOWN_EVENT_TYPES.includes(key)) {
        config.filters[key] = Boolean(newConfig.filters[key]);
      }
    }
  }
  if (newConfig.display) {
    config.display = { ...config.display, ...newConfig.display };
  }
  save();
  return getAll();
}

function save() {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch {
    // Silent fail — non-critical
  }
}

function isEnabled(eventType) {
  return config.filters[eventType] !== false;
}

// Load on import
load();

module.exports = { getAll, update, isEnabled, KNOWN_EVENT_TYPES, DEFAULT_CONFIG };
