import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function Dashboard() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    client
      .get(`/transactions/summary?year=${year}&month=${month}`)
      .then((res) => setSummary(res.data));
    setInsights(""); // clear old insights when month changes
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

  const fmt = (n) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(n);

  const pieData = summary
    ? Object.entries(summary.byCategory).map(([name, value]) => ({ name, value: Number(value) }))
    : [];

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Hello, {user?.fullName?.split(" ")[0]} 👋</h1>
        <div className="flex gap-2">
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
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
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">Income</p>
              <p className="text-2xl font-bold text-green-600">{fmt(summary.income)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">Expenses</p>
              <p className="text-2xl font-bold text-red-600">{fmt(summary.expenses)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">Balance</p>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {fmt(summary.balance)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
            {pieData.length === 0 ? (
              <p className="text-gray-500 py-12 text-center">No expenses this month yet.</p>
            ) : (
              <div style={{ height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-sm p-6 mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">✨ AI Insights</h2>
              <button
                onClick={getInsights}
                disabled={loadingInsights}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
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