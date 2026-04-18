import { FormValues } from "@/app/components/DPRForm";

const STORAGE_KEY = "dpr-configs";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface SavedConfig {
  id: string;
  name: string;
  values: FormValues;
  createdAt: number;
}

function loadConfigs(): SavedConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConfigs(configs: SavedConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function listConfigs(): SavedConfig[] {
  return loadConfigs();
}

export function saveConfig(name: string, values: FormValues): SavedConfig {
  const configs = loadConfigs();
  // Build composite key for uniqueness: character-name|level|move-name
  const compositeKey = [values.characterName, String(values.level), name].filter(Boolean).join("|");
  // Replace existing config with same composite key
  const idx = configs.findIndex(c => {
    const v = c.values;
    const existing = [v.characterName, String(v.level), c.name].filter(Boolean).join("|");
    return existing === compositeKey;
  });
  if (idx >= 0) {
    configs[idx] = { ...configs[idx], values };
    saveConfigs(configs);
    return configs[idx];
  }
  // New config
  const config: SavedConfig = {
    id: randomId(),
    name,
    values,
    createdAt: Date.now(),
  };
  configs.unshift(config);
  saveConfigs(configs);
  return config;
}

export function deleteConfig(id: string) {
  saveConfigs(loadConfigs().filter(c => c.id !== id));
}

export function loadConfig(id: string): SavedConfig | undefined {
  return loadConfigs().find(c => c.id === id);
}
