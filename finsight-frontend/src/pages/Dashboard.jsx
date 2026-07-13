import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area,
} from "recharts";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { emojiFor, fmtLKR } from "../utils/format";

const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#f59e0b", "#10b981", "#14b8a6", "#f43f5e"];


export default function Dashboard() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [insights, setInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    void (async () => {
      setInsights("");
      const [s, d] = await Promise.all([
        client.get(`/transactions/summary?year=${year}&month=${month}`),
        client.get(`/transactions/daily-balances?year=${year}&month=${month}`),
      ]);
      setSummary(s.data);
      setDaily(d.data);
    })();
  }, [year, month]);

  const getInsights = async () => {
    setLoadingInsights(true);
    setInsights("");
    try {
      const { data } = await client.get(`/ai/insights?year=${year}&month=${month}`);
      setInsights(data.insights);
    } finally {
      setLoadingInsights(false);
    }
  };

  const pieData = summary
    ? Object.entries(summary.byCategory)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value)
    : [];

  const totalExpenses = pieData.reduce((sum, d) => sum + d.value, 0);

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">👋 Hi, {user?.fullName?.split(" ")[0]}</p>
          <h1 className="text-2xl font-bold tracking-tight">{greeting()}!</h1>
        </div>
        <div className="flex gap-2">
          <select
            className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium dark:bg-gray-800 dark:shadow-none"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium dark:bg-gray-800 dark:shadow-none"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {summary && (
        <>
          {/* Hero balance card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-500 to-violet-700 text-white p-8 shadow-lg shadow-violet-600/20">
            <p className="text-sm text-white/70 font-medium">Total Balance · {months[month - 1]}</p>
            <p className="text-4xl font-extrabold tracking-tight mt-1">{fmtLKR(summary.balance)}</p>
            <div className="flex gap-6 mt-3 text-sm">
              <span className="text-white/90">↑ Income {fmtLKR(summary.income)}</span>
              <span className="text-white/70">↓ Expenses {fmtLKR(summary.expenses)}</span>
            </div>

            {/* Sparkline */}
            <div className="absolute right-0 bottom-0 left-0 h-24 opacity-60">
              <ResponsiveContainer>
                <AreaChart data={daily} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fill="url(#spark)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Spending overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut card */}
            <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6 dark:bg-gray-800 dark:shadow-none">
              <h2 className="text-lg font-bold mb-4">Spending Overview</h2>
              {pieData.length === 0 ? (
                <p className="text-gray-400 py-16 text-center">No expenses this month yet.</p>
              ) : (
                <div className="relative" style={{ height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={4}
                        cornerRadius={6}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmtLKR(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs text-gray-400 font-medium">Total</p>
                    <p className="text-xl font-extrabold">{fmtLKR(totalExpenses)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Category list card */}
            <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6 dark:bg-gray-800 dark:shadow-none">
              <h2 className="text-lg font-bold mb-4">By Category</h2>
              <div className="space-y-3">
                {pieData.map((d, i) => {
                  const pct = totalExpenses ? Math.round((d.value / totalExpenses) * 100) : 0;
                  return (
                    <div key={d.name} className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${COLORS[i % COLORS.length]}18` }}
                      >
                        {emojiFor(d.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="truncate">{d.name}</span>
                          <span>{fmtLKR(d.value)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden dark:bg-gray-700">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-medium w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
                {pieData.length === 0 && (
                  <p className="text-gray-400 py-8 text-center">Nothing to show yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* AI insights */}
          <div className="bg-gradient-to-r from-brand-50 to-violet-50 rounded-2xl shadow-sm shadow-gray-200/50 p-6 dark:from-brand-900 dark:to-violet-900">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">✨ AI Insights</h2>
              <button
                onClick={getInsights}
                disabled={loadingInsights}
                className="bg-brand-600 text-white px-4 py-2 rounded-3xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {loadingInsights ? "Analyzing..." : "Analyze my month"}
              </button>
            </div>
            {insights && (
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{insights}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}