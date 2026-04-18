"use client";

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DPRRangeChartProps {
  data: ChartData<"line">;
  challengeAc: number;
}

// Plugin to shade between min (index 1) and max (index 2) datasets
const rangeShadePlugin: Plugin<"line"> = {
  id: "rangeShade",
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const metaMin = chart.getDatasetMeta(1); // min
    const metaMax = chart.getDatasetMeta(2); // max
    if (!metaMin.data.length || !metaMax.data.length) return;

    ctx.save();
    ctx.beginPath();
    // Left to right along max (upper line in DPR space = higher value)
    for (let i = 0; i < metaMax.data.length; i++) {
      const pt = metaMax.data[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    // Right to left along min
    for (let i = metaMin.data.length - 1; i >= 0; i--) {
      const pt = metaMin.data[i];
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(156, 163, 175, 0.12)";
    ctx.fill();
    ctx.restore();
  },
};

// eslint-disable-next-line require-jsdoc
export default function DPRRangeChart({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  challengeAc: _challengeAc,
}: DPRRangeChartProps) {
  if (!data.labels?.length) return null;

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
      },
    },
  };

  return (
    <div className="mt-6 h-[300px] w-full">
      <Line options={options} data={data} plugins={[rangeShadePlugin]} />
    </div>
  );
}
