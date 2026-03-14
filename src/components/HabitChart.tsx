"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HabitScorePoint } from "@/types/symbiote";

interface HabitChartProps {
  data: HabitScorePoint[];
}

export default function HabitChart({ data }: HabitChartProps) {
  return (
    <section className="glass rounded-[28px] p-6">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Trend</p>
        <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">30-day habit trajectory</h3>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b6456", fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#6b6456", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(12,9,5,0.94)",
                border: "1px solid rgba(217,119,6,0.24)",
                borderRadius: 16,
                color: "#e8e0d0",
              }}
              labelFormatter={(value) => new Date(String(value)).toLocaleDateString()}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#d97706"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: "#f59e0b" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
