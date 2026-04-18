import { getDb } from "./db";
import { FormValues } from "@/types";

export interface SavedConfig {
  id: string;
  name: string;
  values: FormValues;
  createdAt: number;
}

// eslint-disable-next-line require-jsdoc
function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// eslint-disable-next-line require-jsdoc
export function listConfigs(): SavedConfig[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM configs ORDER BY created_at DESC")
    .all() as Array<{
    id: string;
    name: string;
    values_json: string;
    created_at: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    values: JSON.parse(r.values_json),
    createdAt: r.created_at,
  }));
}

// eslint-disable-next-line require-jsdoc
export function saveConfig(name: string, values: FormValues): SavedConfig {
  const db = getDb();
  const compositeKey = [values.characterName, String(values.level), name]
    .filter(Boolean)
    .join("|");

  // Find existing config with same composite key
  const allRows = db
    .prepare("SELECT id, name, values_json FROM configs")
    .all() as Array<{ id: string; name: string; values_json: string }>;
  let matchId: string | undefined;
  for (const row of allRows) {
    const v = JSON.parse(row.values_json) as FormValues;
    const existingKey = [v.characterName, String(v.level), row.name]
      .filter(Boolean)
      .join("|");
    if (existingKey === compositeKey) {
      matchId = row.id;
      break;
    }
  }

  if (matchId) {
    db.prepare("UPDATE configs SET name = ?, values_json = ? WHERE id = ?").run(
      name,
      JSON.stringify(values),
      matchId
    );
    const updated = db
      .prepare("SELECT * FROM configs WHERE id = ?")
      .get(matchId) as {
      id: string;
      name: string;
      values_json: string;
      created_at: number;
    };
    return {
      id: updated.id,
      name: updated.name,
      values,
      createdAt: updated.created_at,
    };
  }

  const id = randomId();
  const createdAt = Date.now();
  db.prepare(
    "INSERT INTO configs (id, name, values_json, created_at) VALUES (?, ?, ?, ?)"
  ).run(id, name, JSON.stringify(values), createdAt);
  return { id, name, values, createdAt };
}

// eslint-disable-next-line require-jsdoc
export function deleteConfig(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM configs WHERE id = ?").run(id);
}

// eslint-disable-next-line require-jsdoc
export function loadConfig(id: string): SavedConfig | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM configs WHERE id = ?").get(id) as
    | { id: string; name: string; values_json: string; created_at: number }
    | undefined;
  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    values: JSON.parse(row.values_json),
    createdAt: row.created_at,
  };
}
