"use client";

import { useState, useMemo, useEffect, useRef } from "react";

export interface FormValues {
  numAttacks: number;
  toHit: number;
  attackDamage: string;
  extraAttackDamage: string;
  extraTurnDamage: string;
  extraAttackModifier: string;
  extraTurnModifier: string;
  challengeAc: string;
  level: number;
  minDmg: boolean;
  maxDmg: boolean;
  minCrit: number;
  extraCriticals: number;
  rerolledDamageDieCount: number;
  rerolledDamageDieFindValue: string;
  rerolledDamageDieReplaceValue: string;
  missDamage: number;
  characterName: string;
}

interface DPRFormProps {
  values: FormValues;
  onChange: (values: FormValues) => void;
  moveConfigs: { id: string; compositeKey: string }[];
  charNameSuggestions: string[];
  loadedMoveName?: string;
  loadedConfigId?: string;
  onLoadConfig: (id: string) => void;
  onClearLoadedMove?: () => void;
  // Reset all form fields to defaults (called when character name changes)
  onResetFields: (newCharName: string) => void;
  onSaveConfig: (name: string, characterName: string) => void;
  onDeleteConfig: (id: string) => void;
  onMoveDelete: (hasLoadedConfig: boolean, moveName?: string) => void;
  onLocalMoveDelete?: () => void;
  onCharNameDelete: () => void;
  isDirty: boolean;
  // Forces DPRForm to flush local move state on delete
  resetKey?: number;
  // Called when a move is selected from the dropdown — loads full config data
  onMoveSelect?: (id: string, compositeKey: string) => void;
  onClearForm: () => void;
}

const inputClass =
  "w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-gray-600 mb-1";
const sectionTitleClass =
  "col-span-full text-sm font-semibold text-gray-800 mt-4 pb-1 border-b border-gray-200";

// eslint-disable-next-line require-jsdoc
function AutocompleteInput({ value, onChange, configs, placeholder, label, onDelete, onSelect, onDeleteItem }: {
  value: string;
  onChange: (v: string) => void;
  configs: { id: string; compositeKey: string }[];
  placeholder?: string;
  label?: string;
  onDelete?: () => void;
  onSelect?: (id: string, compositeKey: string) => void;
  onDeleteItem?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const filtered = useMemo(() => {
    if (!query.trim()) return configs;
    const q = query.toLowerCase();
    return configs.filter(c => c.compositeKey.toLowerCase().includes(q));
  }, [configs, query]);

  const displayValue = query || value;

  return (
    <div ref={ref} className="relative space-y-1">
      {label && <label className={labelClass}>{label}</label>}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); onChange(e.target.value); }}
          onFocus={() => configs.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={inputClass}
        />
        {onDelete && displayValue && (
          <button
            onClick={onDelete}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-red-500"
            title="Delete"
          >
            ×
          </button>
        )}
      </div>
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center justify-between px-3 py-1.5 text-sm hover:bg-gray-50">
              <button
                onClick={() => { onSelect?.(c.id, c.compositeKey); onChange(c.compositeKey); setQuery(""); setShowDropdown(false); }}
                className="flex-1 text-left"
              >
                {c.compositeKey}
              </button>
              {onDeleteItem && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteItem(c.id); }}
                  className="ml-2 flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-red-500"
                  title="Delete"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line require-jsdoc
export default function DPRForm({ values, onChange, moveConfigs, charNameSuggestions, loadedMoveName, loadedConfigId, onLoadConfig, onSaveConfig, onDeleteConfig, onMoveDelete, onCharNameDelete, isDirty, onClearLoadedMove, onResetFields, onClearForm, resetKey }: DPRFormProps) {
  const set = (field: keyof FormValues, value: number | string | boolean) => {
    onChange({ ...values, [field]: value });
  };

  // When user hasn't edited, use loadedMoveName (controlled). After editing, use local state.
  const [moveLocalValue, setMoveLocalValue] = useState<string | undefined>();
  const [nameEdited, setNameEdited] = useState(false);
  const [moveQuery, setMoveQuery] = useState("");

  // Sync move local state when loaded config changes or is cleared — prevents stale locals from blocking display reset on delete
  useEffect(() => {
    if (!loadedConfigId) {
      setMoveLocalValue(undefined);
      setMoveQuery("");
      setNameEdited(false);
    }
  }, [loadedConfigId]);

  // Flush local move state on every delete — prevents stale locals from blocking display reset
  useEffect(() => {
    if (resetKey !== undefined) {
      setMoveLocalValue(undefined);
      setMoveQuery("");
      setNameEdited(false);
    }
  }, [resetKey]);

  const configName: string = moveLocalValue ?? loadedMoveName ?? "";

  const handleSave = () => {
    if (!configName.trim()) return;
    onSaveConfig(configName.trim(), values.characterName);
  };

  const numField = (
    field: keyof FormValues,
    label: string,
    min?: number,
    max?: number
  ) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={(values[field] as number) ?? ""}
        onChange={(e) => set(field, parseFloat(e.target.value) || 0)}
        className={inputClass}
      />
    </div>
  );

  const textField = (field: keyof FormValues, label: string) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="text"
        value={(values[field] as string) ?? ""}
        onChange={(e) => set(field, e.target.value)}
        className={`${inputClass} border-gray-300`}
      />
    </div>
  );

  const boolField = (field: keyof FormValues, label: string) => (
    <div className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={values[field] as boolean}
        onChange={(e) => set(field, e.target.checked)}
        className="rounded border-gray-300 flex-shrink-0"
      />
      {label}
    </div>
  );

  // Move name local state (separate from characterName autocomplete)
  // Re-uses moveLocalValue/setMoveLocalValue from above for save consistency

  // Always include currently loaded config in dropdown so it can be deleted even if filtered out
  const moveConfigsWithLoaded = useMemo(() => {
    if (!loadedConfigId) return moveConfigs;
    const exists = moveConfigs.some(c => c.id === loadedConfigId);
    if (exists) return moveConfigs;
    // Loaded config was renamed/deleted from under us — still show it for delete access
    return [{ id: loadedConfigId, compositeKey: loadedMoveName ?? '' }, ...moveConfigs];
  }, [moveConfigs, loadedConfigId, loadedMoveName]);

  const filteredMoves = useMemo(() => {
    if (!moveQuery.trim()) return moveConfigsWithLoaded;
    const q = moveQuery.toLowerCase();
    return moveConfigsWithLoaded.filter(c => c.compositeKey.toLowerCase().includes(q));
  }, [moveConfigsWithLoaded, moveQuery]);

  const moveDisplayValue = moveLocalValue ?? loadedMoveName ?? moveQuery;

  // Character name suggestions as autocomplete configs
  const charSuggestions = useMemo(() =>
    charNameSuggestions.map(name => ({ id: name, compositeKey: name })),
    [charNameSuggestions]
  );

  return (
    <div className="space-y-2">
      {/* Config management */}
      <div className="flex gap-2 items-end">
        <div className="relative flex-1 space-y-2">
          <AutocompleteInput
            value={values.characterName}
            onChange={(v) => {
              if (v !== values.characterName && v.trim()) {
                // Character changed — reset all fields and clear move state
                onResetFields(v);
                setMoveLocalValue(undefined);
                setMoveQuery("");
                onClearLoadedMove?.();
              } else {
                set("characterName", v);
              }
            }}
            configs={charSuggestions}
            placeholder="Character name..."
            label="Character Name"
            onDeleteItem={() => onCharNameDelete()}
          />
          {numField("level", "Level", 1, 20)}
          <AutocompleteInput
            value={moveDisplayValue}
            onChange={(v) => {
              // Clear loaded state on first edit so typed input takes over
              if (loadedMoveName && !moveLocalValue) onClearLoadedMove?.();
              setMoveLocalValue(v);
              setMoveQuery("");
              setNameEdited(true);
            }}
            configs={filteredMoves}
            label="Move Name"
            onDeleteItem={onDeleteConfig}
            onSelect={(id, compositeKey) => {
              // Clear local state so display comes from loaded config, not stale locals
              setMoveLocalValue(undefined);
              setMoveQuery("");
              onLoadConfig(id);
              setNameEdited(true);
            }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!configName.trim() || !(isDirty || nameEdited)}
            className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            onClick={onClearForm}
            className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Attack */}
      <p className={sectionTitleClass}>Attack</p>
      <div className="grid grid-cols-3 gap-3">
        {numField("numAttacks", "# Attacks")}
        {numField("toHit", "To Hit")}
        {textField("attackDamage", "Attack Damage")}
      </div>

      {/* Extra Damage */}
      <div className="grid grid-cols-2 gap-3">
        {textField("extraAttackDamage", "Extra Per-Hit Damage")}
        {textField("extraTurnDamage", "Extra Per-Turn Damage")}
      </div>

      {/* Modifiers */}
      <div className="grid grid-cols-2 gap-3">
        {textField("extraAttackModifier", "Extra To-Hit Per-Hit")}
        {textField("extraTurnModifier", "Extra To-Hit Per-Turn")}
      </div>

      {/* Target */}
      <p className={sectionTitleClass}>Target</p>
      <div className="grid grid-cols-2 gap-3">
        {numField("challengeAc", "Challenge AC", 1, 30)}
      </div>

      {/* Options */}
      <p className={sectionTitleClass}>Options</p>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-3">
          {boolField("minDmg", "Min Dmg")}
          {boolField("maxDmg", "Max Dmg")}
        </div>
        <div className="flex flex-wrap gap-3">
          {numField("minCrit", "Min Crit", 2, 20)}
          {numField("extraCriticals", "Extra Critical Dice")}
          {numField("missDamage", "Miss Damage")}
        </div>
        <p className="text-xs font-semibold text-gray-700 mt-3 pb-1 border-b border-gray-100">Reroll</p>
        <div className="grid grid-cols-3 gap-3">
          {numField("rerolledDamageDieCount", "# Dice to Reroll")}
          {textField(
            "rerolledDamageDieFindValue",
            "Highest Face to Reroll (empty = auto)"
          )}
          {textField("rerolledDamageDieReplaceValue", "Replace Value (optional)")}
        </div>
      </div>
    </div>
  );
}
