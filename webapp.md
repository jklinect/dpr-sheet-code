# DPR Calculator Web App — Context File

## Project
Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS. D&D 5e Damage Per Round calculator.
- `webapp/package.json` — deps: next, react 19, chart.js, react-chartjs-2
- `webapp/tsconfig.json` — strict mode, `@/*` alias maps to project root
- `webapp/Justfile` — commands: `dev`, `build`, `start`, `lint`, `check` (tsc --noEmit)

## File Layout
```
webapp/
  app/
    layout.tsx          — Root layout, title "DPR Calculator", bg-gray-50
    page.tsx            — Main component (Home), state management, DPR calc dispatch
    globals.css         — @import "tailwindcss"
    components/
      DPRForm.tsx       — Form with all input fields + autocomplete for char name / move name
      DPRChart.tsx      — Line chart (DPR vs AC) with Chart.js plugins (AC line, expected DPR zones)
      DPRRangeChart.tsx — (untracked, not yet wired in page.tsx)
      DPRTable.tsx      — Ranked table (Top 25 Damage / Efficiency), sortable, per-row delete ×
  lib/
    calc.ts             — Core DPR math: parseDamage, calculateToHit, calculateToCrit, calculateDpr, getEvRerolled
    constants.ts        — expectedDprByLevel (level 1-20 reference values)
    storage.ts          — localStorage CRUD for SavedConfig (key "dpr-configs")
  types.ts              — AttackParams, RollOptions, SpellParams interfaces
```

## Key Data Flow (page.tsx = Home)
- **State**: `values` (FormValues), `configs` (SavedConfig[] from localStorage), `lastCleanValues`, `loadedMoveName`, `loadedConfigId`, `deleteKey`
- **Save** (`handleSaveConfig`): saves to localStorage, updates configs list
- **Load** (`handleLoadConfig`): loads config into values + sets loadedMoveName/loadedConfigId
- **Delete config** (`handleDeleteConfig`): deletes from localStorage, clears loaded state if matching
- **Delete profile** (`handleDeleteProfile`): same as handleDeleteConfig but called from DPRTable
- **DPR calc**: useMemo on `values`, computes line chart data for AC 5-30 with 4 conditions (Normal/Advantage/Disadvantage/Elven Accuracy)
- **Range chart**: separate useMemo, 3 datasets (Normal/Min Damage/Max Damage)
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
- `onSaveConfig`: saves to localStorage
- `onDeleteConfig`: deletes config by id from localStorage
- `onMoveDelete(hasLoadedConfig, moveName?)`: if loaded config → delete by ID; else (typed name) → search localStorage for matching configs by name and delete them. Resets all fields except characterName.
- `onCharNameDelete`: deletes ALL configs matching current characterName
- `onResetFields(newCharName)`: resets values to defaults with new charName
- `onClearForm`: resets values + lastCleanValues + loaded state + increments deleteKey (flushes move locals)

## localStorage Schema
- Key: `"dpr-configs"` — array of SavedConfig objects
- SavedConfig: `{ id, name, values: FormValues, createdAt }`
- Uniqueness: composite key `characterName|level|name` — saves with same key replace existing config
- DPRTable shows top 25 configs sorted by DPR or × Expected (vs level reference)

## Recent Changes (from git history)
- Move delete now deletes matching localStorage configs + clears text fields
- Clear button resets move name field via deleteKey flush mechanism
- Inline × buttons on autocomplete dropdown items for move configs
- Removed standalone × button next to Move Name input (all deletes are inline in dropdown)

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
