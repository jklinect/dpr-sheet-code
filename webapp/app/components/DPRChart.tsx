"use client";

import { useEffect } from "react";
import type { ChartData, ChartOptions, Plugin } from "chart.js";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { expectedDprByLevel } from "@/lib/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DPRChartProps {
  data: ChartData<"line">;
  challengeAc: number;
  level: number;
}

// Module-level mutable refs so the stable plugins can read current values
let _currentAc = 10;
let _currentLevel = 1;

// Stable plugin — identity never changes, reads AC from module var
const acLinePlugin: Plugin<"line"> = {
  id: "acLine",
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales.x || !scales.y) return;

    const xPixel = scales.x.getPixelForValue(_currentAc);
    if (xPixel < chartArea.left || xPixel > chartArea.right) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xPixel, chartArea.top);
    ctx.lineTo(xPixel, chartArea.bottom);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(156, 163, 175, 0.8)";
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.fillText(`AC ${_currentAc}`, xPixel, chartArea.top - 4);
    ctx.restore();
  },
};

// Shaded zones + reference lines plugin — always visible
const expectedDprPlugin: Plugin<"line"> = {
  id: "expectedDpr",
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales.y) return;

    const level = _currentLevel;
    const expected1x = expectedDprByLevel[level] ?? 0;
    const expected2x = expected1x * 2;

    // Shade 0 to 1x — light red (canvas Y: higher DPR = lower pixel)
    if (expected1x > 0) {
      const y1x = scales.y.getPixelForValue(expected1x);
      ctx.save();
      ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
      ctx.fillRect(
        chartArea.left,
        y1x,
        chartArea.right - chartArea.left,
        chartArea.bottom - y1x
      );
      ctx.restore();
    }

    // Shade 1x to 2x — light green (y2x < y1x in pixel coords since higher DPR = lower Y)
    if (expected2x > expected1x) {
      const y1x = scales.y.getPixelForValue(expected1x);
      const y2x = scales.y.getPixelForValue(expected2x);
      ctx.save();
      ctx.fillStyle = "rgba(34, 197, 94, 0.15)";
      ctx.fillRect(
        chartArea.left,
        y2x,
        chartArea.right - chartArea.left,
        y1x - y2x
      );
      ctx.restore();
    }

    // Red line at 1x
    if (expected1x > 0) {
      const yPixel = scales.y.getPixelForValue(expected1x);
      if (yPixel >= chartArea.top && yPixel <= chartArea.bottom) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(chartArea.left, yPixel);
        ctx.lineTo(chartArea.right, yPixel);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ef4444";
        ctx.setLineDash([6, 3]);
        ctx.stroke();

        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#ef4444";
        ctx.textAlign = "right";
        ctx.fillText("Expected DPR", chartArea.right - 4, yPixel - 5);
        ctx.restore();
      }
    }

    // Green line at 2x
    if (expected2x > 0) {
      const yPixel = scales.y.getPixelForValue(expected2x);
      if (yPixel >= chartArea.top && yPixel <= chartArea.bottom) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(chartArea.left, yPixel);
        ctx.lineTo(chartArea.right, yPixel);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#22c55e";
        ctx.setLineDash([6, 3]);
        ctx.stroke();

        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#22c55e";
        ctx.textAlign = "right";
        ctx.fillText("2× Expected DPR", chartArea.right - 4, yPixel - 5);
        ctx.restore();
      }
    }
  },
};

// eslint-disable-next-line require-jsdoc
export default function DPRChart({ data, challengeAc, level }: DPRChartProps) {
  useEffect(() => {
    _currentAc = challengeAc;
    _currentLevel = level;
  }, [challengeAc, level]);

  const expected2x = (expectedDprByLevel[level] ?? 0) * 2;
  const dataMax = Math.max(
    0,
    ...data.datasets.flatMap((d) => d.data as number[])
  );
  const yMax = Math.ceil(Math.max(dataMax, expected2x) * 1.1);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      x: {
        type: "linear" as const,
        title: { display: true, text: "Armor Class" },
        min: 5,
        max: 30,
        ticks: { stepSize: 1 },
      },
      y: {
        title: { display: true, text: "DPR" },
        beginAtZero: true,
        max: Math.ceil(
          Math.max(yMax, ...data.datasets.flatMap((d) => d.data as number[])) *
            1.05
        ),
      },
    },
  };

  return (
    <div className="h-[360px] w-full">
      <Line
        options={options}
        data={data}
        plugins={[acLinePlugin, expectedDprPlugin]}
      />
    </div>
  );
}
