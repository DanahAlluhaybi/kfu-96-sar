"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryStat, TrendPoint } from "@/lib/types";
import { useI18n } from "../I18nProvider";

const axis = { fontSize: 12, fill: "#6B7275", fontFamily: "var(--font-digital)" };
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #DDE7E9",
  boxShadow: "0 8px 24px -12px rgba(12,63,65,.2)",
  fontFamily: "var(--font-digital)",
  fontSize: 13,
};

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const { t } = useI18n();
  return (
    <div dir="ltr" className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#50A7AE" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#50A7AE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#EEF3F4" />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: "#DDE7E9" }} minTickGap={16} />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [String(v), t.admin.kpi.total]} cursor={{ stroke: "#8FCBCF" }} />
          <Area type="monotone" dataKey="count" stroke="#115153" strokeWidth={2.25} fill="url(#trendFill)" dot={false} activeDot={{ r: 4, fill: "#E5AE29", stroke: "#fff" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionChart({ data, measure }: { data: CategoryStat[]; measure: "share" | "reach" }) {
  const { lang, t } = useI18n();
  const rows = data.map((c) => ({
    name: CATEGORIES[c.key].label[lang],
    value: c[measure],
    count: c.count,
    color: CATEGORIES[c.key].color,
  }));
  return (
    <div dir="ltr" className="w-full" style={{ height: Math.max(rows.length * 44, 200) }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke="#EEF3F4" />
          <XAxis type="number" domain={[0, "dataMax"]} tick={axis} tickLine={false} axisLine={false} unit="%" />
          <YAxis type="category" dataKey="name" width={130} tick={{ ...axis, fill: "#1F2123", fontWeight: 600 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "#F1F7F7" }}
            formatter={(v: unknown, _n: unknown, p: unknown) => [
              `${String(v)}% · ${(p as { payload?: { count?: number } })?.payload?.count ?? 0} ${t.results.picks}`,
              measure === "share" ? t.admin.shareOfPicks : t.admin.shareOfPeople,
            ]}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{ position: "right", fill: "#3A3A3C", fontSize: 12, formatter: (v: unknown) => `${String(v)}%` }}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
