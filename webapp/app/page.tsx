"use client";

import { useState, useMemo, useEffect } from "react";
import React from "react";
import DPRForm, { FormValues } from "./components/DPRForm";
import DPRChart from "./components/DPRChart";
import DPRRangeChart from "./components/DPRRangeChart";
import DPRTable, { RankedTable } from "./components/DPRTable";
import { calculateDpr } from "@/lib/calc";
import { listConfigs, saveConfig as saveConfigToStorage, loadConfig as loadConfigFromStorage, deleteConfig as deleteConfigFromStorage, SavedConfig } from "@/lib/storage";
import type { ChartData } from "chart.js";

interface TabBarProps {
  tabs: { label: string; content: React.ReactNode }[];
}

// eslint-disable-next-line require-jsdoc
function TabBar({ tabs }: TabBarProps) {
  const [active, setActive] = useState(0);
  if (!tabs?.length) return null;
  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-3 py-1.5 text-sm font-medium ${
              active === i
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}

const defaultValues: FormValues = {
  numAttacks: 1,
  toHit: 0,
  attackDamage: "1d6",
  extraAttackDamage: "",
  extraTurnDamage: "",
  extraAttackModifier: "",
  extraTurnModifier: "",
  challengeAc: "10",
  level: 1,
  minDmg: false,
  maxDmg: false,
  minCrit: 20,
  extraCriticals: 0,
  rerolledDamageDieCount: 0,
  rerolledDamageDieFindValue: "",
  rerolledDamageDieReplaceValue: "",
  missDamage: 0,
  characterName: "",
};

// eslint-disable-next-line require-jsdoc
export default function Home() {
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const [lastCleanValues, setLastCleanValues] = useState<FormValues>(defaultValues);
  const [loadedMoveName, setLoadedMoveName] = useState<string | undefined>();
  const [loadedConfigId, setLoadedConfigId] = useState<string | undefined>();
  const [showSaved, setShowSaved] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteKey, setDeleteKey] = useState(0);

  // Load config list on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    setConfigs(listConfigs());
  }, []);

  const handleSaveConfig = (name: string, characterName: string) => {
    saveConfigToStorage(name, values);
    setLastCleanValues(values);
    setLoadedMoveName(undefined);
    setLoadedConfigId(undefined);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
    setConfigs(listConfigs());
  };

  const handleLoadConfig = (id: string) => {
    const config = loadConfigFromStorage(id);
    if (config) {
      setValues(config.values);
      setLastCleanValues({ ...config.values });
      setLoadedMoveName(config.name);
      setLoadedConfigId(id);
    }
  };

  const handleDeleteConfig = (id: string) => {
    deleteConfigFromStorage(id);
    if (loadedConfigId === id) {
      setLoadedMoveName(undefined);
      setLoadedConfigId(undefined);
    }
    setShowDeleted(true);
    setTimeout(() => setShowDeleted(false), 1500);
    setConfigs(listConfigs());
  };

  const handleMoveDelete = (hasLoadedConfig: boolean, moveName?: string) => {
    if (hasLoadedConfig && loadedConfigId) {
      deleteConfigFromStorage(loadedConfigId);
      setLoadedMoveName(undefined);
      setLoadedConfigId(undefined);
    } else if (moveName?.trim()) {
      // Delete any saved config matching the typed move name
      const allConfigs = listConfigs();
      for (const c of allConfigs) {
        if (c.name === moveName.trim() || `${c.values.characterName} - ${c.name}` === moveName.trim()) {
          deleteConfigFromStorage(c.id);
          if (loadedConfigId === c.id) {
            setLoadedMoveName(undefined);
            setLoadedConfigId(undefined);
          }
        }
      }
    }
    setShowDeleted(true);
    setTimeout(() => setShowDeleted(false), 1500);
    // Keep characterName, reset all other fields to defaults
    const charName = values.characterName;
    setValues({ ...defaultValues, characterName: charName });
    setLastCleanValues(defaultValues);
    setConfigs(listConfigs());
    setDeleteKey(k => k + 1);
  };

  const handleDeleteProfile = (id: string) => {
    deleteConfigFromStorage(id);
    if (loadedConfigId === id) {
      setLoadedMoveName(undefined);
      setLoadedConfigId(undefined);
    }
    setShowDeleted(true);
    setTimeout(() => setShowDeleted(false), 1500);
    setValues(defaultValues);
    setLastCleanValues(defaultValues);
    setConfigs(listConfigs());
    setDeleteKey(k => k + 1);
  };

  const handleCharNameDelete = () => {
    const charName = values.characterName;
    if (!charName) return;
    // Delete all configs for this character name
    const toDelete = listConfigs().filter(c => c.values.characterName === charName);
    toDelete.forEach(c => deleteConfigFromStorage(c.id));
    setValues({ ...defaultValues, characterName: "" });
    setLastCleanValues(defaultValues);
    setLoadedMoveName(undefined);
    setLoadedConfigId(undefined);
    setConfigs(listConfigs());
  };

  const handleResetFields = (newCharName: string) => {
    setValues({ ...defaultValues, characterName: newCharName });
    setLastCleanValues(defaultValues);
    setLoadedMoveName(undefined);
    setLoadedConfigId(undefined);
  };

  const chartData = useMemo<ChartData<"line">>(() => {
    if (values.numAttacks === 0) {
      return { labels: [], datasets: [] };
    }

    const acs = Array.from({ length: 26 }, (_, i) => i + 5); // AC 5-30

    const conditions = [
      { label: "Normal", advantage: false, disadvantage: false, elvenAccuracy: false },
      { label: "Advantage", advantage: true, disadvantage: false, elvenAccuracy: false },
      { label: "Disadvantage", advantage: false, disadvantage: true, elvenAccuracy: false },
      { label: "Elven Accuracy", advantage: false, disadvantage: false, elvenAccuracy: true },
    ];

    return {
      labels: acs.map(String),
      datasets: conditions.map((cond) => ({
        label: cond.label,
        data: acs.map((ac) => {
          const rerollFindValue = values.rerolledDamageDieFindValue
            ? parseFloat(values.rerolledDamageDieFindValue) || undefined
            : undefined;
          const rerollReplaceValue = values.rerolledDamageDieReplaceValue
            ? parseFloat(values.rerolledDamageDieReplaceValue) || undefined
            : undefined;

          return calculateDpr(
            values.numAttacks,
            values.toHit,
            values.attackDamage,
            values.extraAttackDamage,
            values.extraTurnDamage,
            values.extraAttackModifier,
            values.extraTurnModifier,
            String(ac),
            values.minDmg,
            values.maxDmg,
            cond.advantage,
            cond.disadvantage,
            values.minCrit,
            cond.elvenAccuracy,
            values.extraCriticals,
            values.rerolledDamageDieCount,
            rerollFindValue,
            rerollReplaceValue,
            values.missDamage
          );
        }),
        borderColor:
          {
            Normal: "#6366f1",
            Advantage: "#22c55e",
            Disadvantage: "#ef4444",
            "Elven Accuracy": "#f59e0b",
          }[cond.label] || "#6b7280",
        backgroundColor:
          {
            Normal: "#6366f1",
            Advantage: "#22c55e",
            Disadvantage: "#ef4444",
            "Elven Accuracy": "#f59e0b",
          }[cond.label] || "#6b7280",
        tension: 0.1,
        pointRadius: 3,
      })),
    };
  }, [values]);

  const rangeChartData = useMemo<ChartData<"line">>(() => {
    if (values.numAttacks === 0) {
      return { labels: [], datasets: [] };
    }

    const acs = Array.from({ length: 26 }, (_, i) => i + 5); // AC 5-30;

    const rerollFindValue = values.rerolledDamageDieFindValue
      ? parseFloat(values.rerolledDamageDieFindValue) || undefined
      : undefined;
    const rerollReplaceValue = values.rerolledDamageDieReplaceValue
      ? parseFloat(values.rerolledDamageDieReplaceValue) || undefined
      : undefined;

    return {
      labels: acs.map(String),
      datasets: [
        {
          label: "Normal",
          data: acs.map((ac) => calculateDpr(
            values.numAttacks, values.toHit, values.attackDamage,
            values.extraAttackDamage, values.extraTurnDamage,
            values.extraAttackModifier, values.extraTurnModifier,
            String(ac), false, false, false, false,
            values.minCrit, false, values.extraCriticals,
            values.rerolledDamageDieCount, rerollFindValue, rerollReplaceValue, values.missDamage
          )),
          borderColor: "#6366f1", backgroundColor: "#6366f1", tension: 0.1, pointRadius: 3,
        },
        {
          label: "Min Damage",
          data: acs.map((ac) => calculateDpr(
            values.numAttacks, values.toHit, values.attackDamage,
            values.extraAttackDamage, values.extraTurnDamage,
            values.extraAttackModifier, values.extraTurnModifier,
            String(ac), true, false, false, false,
            values.minCrit, false, values.extraCriticals,
            values.rerolledDamageDieCount, rerollFindValue, rerollReplaceValue, values.missDamage
          )),
          borderColor: "#9ca3af", backgroundColor: "#9ca3af", tension: 0.1, pointRadius: 2,
          borderDash: [5, 3],
        },
        {
          label: "Max Damage",
          data: acs.map((ac) => calculateDpr(
            values.numAttacks, values.toHit, values.attackDamage,
            values.extraAttackDamage, values.extraTurnDamage,
            values.extraAttackModifier, values.extraTurnModifier,
            String(ac), false, true, false, false,
            values.minCrit, false, values.extraCriticals,
            values.rerolledDamageDieCount, rerollFindValue, rerollReplaceValue, values.missDamage
          )),
          borderColor: "#9ca3af", backgroundColor: "#9ca3af", tension: 0.1, pointRadius: 2,
          borderDash: [5, 3],
        },
      ],
    };
  }, [values]);

  // Compute DPR at current AC for display
  const currentAcDpr = useMemo(() => {
    const ac = parseInt(values.challengeAc) || 10;
    const rerollFindValue = values.rerolledDamageDieFindValue
      ? parseFloat(values.rerolledDamageDieFindValue) || undefined
      : undefined;
    const rerollReplaceValue = values.rerolledDamageDieReplaceValue
      ? parseFloat(values.rerolledDamageDieReplaceValue) || undefined
      : undefined;

    return calculateDpr(
      values.numAttacks,
      values.toHit,
      values.attackDamage,
      values.extraAttackDamage,
      values.extraTurnDamage,
      values.extraAttackModifier,
      values.extraTurnModifier,
      String(ac),
      values.minDmg,
      values.maxDmg,
      false, // normal
      false,
      values.minCrit,
      false,
      values.extraCriticals,
      values.rerolledDamageDieCount,
      rerollFindValue,
      rerollReplaceValue,
      values.missDamage
    );
  }, [values]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">DPR Calculator</h1>
        {showSaved && (
          <span className="text-sm text-green-600 font-medium animate-pulse mr-3">✓ Profile saved</span>
        )}
        {showDeleted && (
          <span className="text-sm text-red-500 font-medium animate-pulse mr-3">✓ Profile deleted</span>
        )}
        <div className="rounded-lg bg-indigo-50 px-4 py-2 text-indigo-700">
          <span className="text-xs font-medium">Current DPR:</span>{" "}
          <span className="ml-1 text-lg font-bold">
            {currentAcDpr.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left sidebar - form */}
        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <DPRForm
            values={values}
            onChange={setValues}
            moveConfigs={configs.filter(c => !values.characterName || c.values.characterName === values.characterName)
              .map(c => ({ id: c.id, compositeKey: c.name }))}
            charNameSuggestions={[...new Set(configs.map(c => c.values.characterName).filter(Boolean))]}
            loadedMoveName={loadedMoveName}
            onLoadConfig={handleLoadConfig}
            onSaveConfig={handleSaveConfig}
            onDeleteConfig={handleDeleteConfig}
            onMoveDelete={handleMoveDelete}
            onCharNameDelete={handleCharNameDelete}
            onClearLoadedMove={() => { setLoadedMoveName(undefined); }}
            onResetFields={handleResetFields}
            isDirty={JSON.stringify(values) !== JSON.stringify(lastCleanValues)}
            resetKey={deleteKey}
            onClearForm={() => {
              setValues(defaultValues);
              setLastCleanValues(defaultValues);
              setLoadedMoveName(undefined);
              setLoadedConfigId(undefined);
              setDeleteKey(k => k + 1); // flush local move state
            }}
          />
        </aside>

        {/* Right - tabbed interface */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <TabBar tabs={[
            { label: "Graph", content: (
              <>
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                  DPR vs Armor Class
                </h2>
                <DPRChart
                  data={chartData}
                  challengeAc={parseInt(values.challengeAc) || 10}
                  level={values.level}
                />
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                  Expected Damage Range vs Armor Class
                </h2>
                <DPRRangeChart
                  data={rangeChartData}
                  challengeAc={parseInt(values.challengeAc) || 10}
                />
              </>
            )},
            { label: "Top 25 - Damage", content: (
              <RankedTable configs={configs} level={values.level} title="Top 25 - Damage" metric="dpr" onDelete={handleDeleteProfile} />
            )},
            { label: "Top 25 - Efficiency", content: (
              <RankedTable configs={configs} level={values.level} title="Top 25 - Efficiency" metric="multiple" onDelete={handleDeleteProfile} />
            )},
          ]} />
        </section>
      </div>
    </main>
  );
}
