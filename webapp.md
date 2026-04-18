# DPR Calculator Web App — Context File

## Project
Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS. D&D 5e Damage Per Round calculator.
- `webapp/package.json` — deps: next, react 19, chart.js, react-chartjs-2; devDeps: better-sqlite3 ^11.7.0, @types/better-sqlite3 ^7.6.13
- `webapp/tsconfig.json` — strict mode, `@/*` alias maps to project root
- `webapp/Justfile` — commands: `dev`, `build`, `start`, `lint`, `check` (tsc --noEmit)

## File Layout
```
webapp/
  app/
    layout.tsx          — Root layout, title "DPR Calculator", favicon (two d6 dice), bg-gray-50
    page.tsx            — Main component (Home), state management, DPR calc dispatch
    globals.css         — @import "tailwindcss"
    api/
      configs/route.ts  — GET listConfigs(), POST saveConfig()
      configs/[id]/route.ts — GET loadConfig(id), DELETE deleteConfig(id)
    components/
      DPRForm.tsx       — Form with all input fields + autocomplete for char name / move name
      DPRChart.tsx      — Line chart (DPR vs AC) with Chart.js plugins (AC line, expected DPR zones)
      DPRRangeChart.tsx — Range chart (min/max shade), 3 datasets
      DPRTable.tsx      — Ranked table (Top 25 Damage / Efficiency), sortable, per-row delete ×
  lib/
    calc.ts             — Core DPR math: parseDamage, calculateToHit, calculateToCrit, calculateDpr, getEvRerolled
    constants.ts        — expectedDprByLevel (level 1-20 reference values)
    db.ts               — SQLite DB singleton, WAL mode, schema init
    storage.ts          — SQLite-backed CRUD for SavedConfig (better-sqlite3)
  public/
    favicon.svg         — two d6 dice (white, purple pips) showing single dot each
  types.ts              — AttackParams, RollOptions, SpellParams interfaces, FormValues interface
```

## Key Data Flow (page.tsx = Home)
- **State**: `values` (FormValues), `configs` (SavedConfig[] from `/api/configs` fetch), `lastCleanValues`, `loadedMoveName`, `loadedConfigId`, `deleteKey`
- **Save** (`handleSaveConfig`): POST to `/api/configs`, updates configs list
- **Load** (`handleLoadConfig`): GET `/api/configs/[id]`, loads config into values + sets loadedMoveName/loadedConfigId
- **Delete config** (`handleDeleteConfig`): DELETE `/api/configs/[id]`, clears loaded state if matching
- **Delete profile** (`handleDeleteProfile`): same as handleDeleteConfig but called from DPRTable
- **DPR calc**: useMemo on `values`, computes line chart data for AC 5-30 with 4 conditions (Normal/Advantage/Disadvantage/Elven Accuracy)
- **Range chart**: separate useMemo, 3 datasets (Normal/Min Damage/Max Damage), rangeShade plugin shades min-max band
- **Current DPR display**: single value at current challenge AC

## DPRForm Component
### FormValues interface (exported)
```ts
interface FormValues {
  numAttacks: number; toHit: number; attackDamage: string; extraAttackDamage: string;
  extraTurnDamage: string; extraAttackModifier: string; extraTurnModifier: string;
  challengeAc: string; level: number; minDmg: boolean; maxDmg: boolean;
  minCrit: number; extraCriticals: number; rerolledDamageDieCount: number;
  rerolledDamageDieFindValue: string; rerolledDamageDieReplaceValue: string;
  missDamage: number; characterName: string;
}
```

### AutocompleteInput (internal)
- Generic autocomplete with dropdown, search filtering, click-outside dismiss
- Props: `value`, `onChange`, `configs` ({id, compositeKey}[]), `placeholder`, `label`, `onDelete` (× button next to input), `onSelect` (click item), `onDeleteItem` (× button inline on each dropdown item)

### DPRForm state management
- **Move Name local state**: `moveLocalValue`, `moveQuery`, `nameEdited` — separate from FormValues to handle loaded vs typed distinction
- **Sync**: useEffect on `loadedConfigId` clears locals when config is cleared; useEffect on `resetKey` flushes locals on delete
- **moveConfigsWithLoaded**: useMemo that always includes currently loaded config in dropdown (even if filtered out) so it's deletable via inline ×
- **filteredMoves**: filters moveConfigsWithLoaded by query

### Key handlers passed from page.tsx
- `onChange`: sets single field via spread
- `onSaveConfig`: POST to `/api/configs` with name + FormValues
- `onDeleteConfig`: DELETE `/api/configs/[id]` for a single config
- `onMoveDelete(hasLoadedConfig, moveName?)`: if loaded config → delete by ID; else (typed name) → search configs list for matching names and delete each. Resets all fields except characterName.
- `onCharNameDelete`: deletes ALL configs matching current character name (called via onDeleteItem on char dropdown × buttons)
- `onResetFields(newCharName)`: resets values to defaults with new charName
- `onClearForm`: resets values + lastCleanValues + loaded state + increments deleteKey (flushes move locals)

## Storage Schema (SQLite)
- DB file: `webapp/data/dpr.db` (ignored in .gitignore)
- Table: `configs(id TEXT PRIMARY KEY, name TEXT NOT NULL, values_json TEXT NOT NULL, created_at INTEGER NOT NULL)`
- WAL mode (`PRAGMA journal_mode = WAL`) for concurrent access safety
- SavedConfig: `{ id, name, values: FormValues, createdAt }`
- Uniqueness: composite key `characterName|level|name` — saves with same key replace existing config
- DPRTable shows top 25 configs sorted by DPR or × Expected (vs level reference)

## Recent Changes (from git history)
- Migrated storage from localStorage to SQLite (`better-sqlite3`, WAL mode)
- Replaced direct `lib/storage.ts` imports with Next.js API routes (`/api/configs`, `/api/configs/[id]`)
- Moved `FormValues` interface from DPRForm.tsx to shared `types.ts` (server-side code can't import "use client" components)
- DPRRangeChart wired in: 3 datasets, rangeShade plugin shades min-max band
- Inline × buttons on autocomplete dropdown items for move configs
- Removed standalone × button next to Move Name input (all deletes are inline in dropdown)
- Character Name: removed standalone × button, added inline × on each dropdown item via onDeleteItem (calls onCharNameDelete — deletes all configs for that character name)
- Replaced d20 favicon with two d6 dice (white dice, purple center pips); wired via metadata in layout.tsx

## Props Interface (DPRFormProps)
```ts
interface DPRFormProps {
  values: FormValues; onChange: (values: FormValues) => void;
  moveConfigs: { id: string; compositeKey: string }[];
  charNameSuggestions: string[];
  loadedMoveName?: string; loadedConfigId?: string;
  onLoadConfig: (id: string) => void; onClearLoadedMove?: () => void;
  onResetFields: (newCharName: string) => void;
  onSaveConfig: (name: string, characterName: string) => void;
  onDeleteConfig: (id: string) => void;
  onMoveDelete: (hasLoadedConfig: boolean, moveName?: string) => void;
  onCharNameDelete: () => void; isDirty: boolean; resetKey?: number;
  onClearForm: () => void;
}
```
