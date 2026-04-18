"use client";

import { useState, useMemo } from "react";
import { SavedConfig } from "@/lib/storage";
import { calculateDpr } from "@/lib/calc";
import { expectedDprByLevel } from "@/lib/constants";

type SortDir = "asc" | "desc";

interface DPRTableProps {
  configs: SavedConfig[];
  level: number;
  onDelete?: (id: string) => void;
}

// eslint-disable-next-line require-jsdoc
function Chevron({ dir }: { dir: SortDir }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {dir === "asc" ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
    </svg>
  );
}

// eslint-disable-next-line require-jsdoc
function RankedTableInner({
  configs,
  level,
  title,
  metric,
  onDelete,
}: {
  configs: SavedConfig[];
  level: number;
  title: string;
  metric: "dpr" | "multiple";
  onDelete?: (id: string) => void;
}) {
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const expectedDpr = expectedDprByLevel[level] ?? 0;

  const rows = useMemo(() => {
    return configs.map((c) => {
      const ac = parseInt(c.values.challengeAc) || 10;
      const rerollFindValue = c.values.rerolledDamageDieFindValue
        ? parseFloat(c.values.rerolledDamageDieFindValue) || undefined
        : undefined;
      const rerollReplaceValue = c.values.rerolledDamageDieReplaceValue
        ? parseFloat(c.values.rerolledDamageDieReplaceValue) || undefined
        : undefined;

      const dpr = calculateDpr(
        c.values.numAttacks,
        c.values.toHit,
        c.values.attackDamage,
        c.values.extraAttackDamage,
        c.values.extraTurnDamage,
        c.values.extraAttackModifier,
        c.values.extraTurnModifier,
        String(ac),
        c.values.minDmg,
        c.values.maxDmg,
        false,
        false,
        c.values.minCrit,
        false,
        c.values.extraCriticals,
        c.values.rerolledDamageDieCount,
        rerollFindValue,
        rerollReplaceValue,
        c.values.missDamage
      );

      const multiple = expectedDpr > 0 ? dpr / expectedDpr : 0;

      return {
        id: c.id,
        name: c.name,
        characterName: c.values.characterName,
        level: c.values.level,
        dpr,
        multiple,
      };
    });
  }, [configs, expectedDpr]);

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const cmp = metric === "dpr" ? a.dpr - b.dpr : a.multiple - b.multiple;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted.slice(0, 25);
  }, [rows, sortDir, metric]);

  const handleSort = () => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  if (configs.length === 0) return null;

  const label = metric === "dpr" ? "DPR" : "× Expected";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold text-gray-700">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
              Character
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
              Level
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
              Move
            </th>
            <th
              onClick={handleSort}
              className="cursor-pointer px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider hover:bg-gray-50"
            >
              {label}
              <Chevron dir={sortDir} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr
              key={`${row.name}-${i}`}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="px-4 py-2 font-medium">
                {row.characterName || "-"}
              </td>
              <td className="px-4 py-2">{row.level}</td>
              <td className="px-4 py-2 flex items-center gap-1">
                {row.name}
                {onDelete && (
                  <button
                    onClick={() => onDelete(row.id)}
                    className="ml-1 text-gray-300 hover:text-red-500"
                    title="Delete profile"
                  >
                    ×
                  </button>
                )}
              </td>
              <td className="px-4 py-2">
                {metric === "dpr"
                  ? row.dpr.toFixed(2)
                  : `${row.multiple.toFixed(2)}×`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// eslint-disable-next-line require-jsdoc
export function RankedTable({
  configs,
  level,
  title,
  metric,
  onDelete,
}: {
  configs: SavedConfig[];
  level: number;
  title: string;
  metric: "dpr" | "multiple";
  onDelete?: (id: string) => void;
}) {
  return (
    <RankedTableInner
      configs={configs}
      level={level}
      title={title}
      metric={metric}
      onDelete={onDelete}
    />
  );
}

// eslint-disable-next-line require-jsdoc
function SubTable({ configs, level }: DPRTableProps) {
  if (configs.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RankedTableInner
          configs={configs}
          level={level}
          title="Top 25 - Damage"
          metric="dpr"
        />
        <RankedTableInner
          configs={configs}
          level={level}
          title="Top 25 - Efficiency"
          metric="multiple"
        />
      </div>
    </div>
  );
}

// eslint-disable-next-line require-jsdoc
export default function DPRTable({ configs, level }: DPRTableProps) {
  if (configs.length === 0) return null;

  return <SubTable configs={configs} level={level} />;
}
