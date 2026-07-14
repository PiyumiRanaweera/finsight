import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client";
import { errorMessage } from "../api/errors";
import { emojiFor, fmtLKR } from "../utils/format";

const STATUS_STYLES = {
  ON_TRACK: { bar: "bg-emerald-500", label: "On track", text: "text-emerald-600 dark:text-emerald-400" },
  AT_RISK: { bar: "bg-amber-500", label: "At risk", text: "text-amber-600 dark:text-amber-400" },
  OVER: { bar: "bg-red-500", label: "Over budget", text: "text-red-600 dark:text-red-400" },
};

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ categoryId: "", monthlyLimit: "" });

  const load = async () => {
    const [b, c] = await Promise.all([client.get("/budgets"), client.get("/categories")]);
    setBudgets(b.data);
    setCategories(c.data);
  };

  useEffect(() => { void load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await client.put("/budgets", {
        categoryId: Number(form.categoryId),
        monthlyLimit: parseFloat(form.monthlyLimit),
      });
      toast.success("Budget saved 💰");
      setForm({ categoryId: "", monthlyLimit: "" });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/budgets/${id}`);
      toast.success("Budget removed");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const input = "border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

  const unbudgeted = categories.filter(
    (c) => !budgets.some((b) => b.categoryId === c.id)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>

      {/* Set budget form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm shadow-gray-200/50 dark:shadow-none p-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-40">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Category</label>
          <select className={`${input} w-full`} value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
            <option value="">Choose...</option>
            {unbudgeted.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {budgets.map((b) => (
              <option key={`b-${b.categoryId}`} value={b.categoryId}>{b.categoryName} (update)</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-40">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Monthly limit (LKR)</label>
          <input className={`${input} w-full`} type="number" min="1" step="0.01"
            value={form.monthlyLimit}
            onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })} required />
        </div>
        <button className="bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 cursor-pointer">
          Save
        </button>
      </form>

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm shadow-gray-200/50 dark:shadow-none p-16 text-center">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No budgets set</p>
          <p className="text-gray-400 text-sm">Pick a category and set your first monthly limit!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const s = STATUS_STYLES[b.status];
            return (
              <div key={b.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm shadow-gray-200/50 dark:shadow-none p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center text-xl">
                      {emojiFor(b.categoryName)}
                    </div>
                    <div>
                      <p className="font-bold">{b.categoryName}</p>
                      <p className={`text-xs font-semibold ${s.text}`}>{s.label}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(b.id)}
                    className="text-gray-300 dark:text-gray-500 hover:text-red-500 cursor-pointer">✕</button>
                </div>

                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold">{fmtLKR(b.spent)}</span>
                  <span className="text-gray-400">of {fmtLKR(b.monthlyLimit)}</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full transition-all ${s.bar}`}
                    style={{ width: `${b.percentUsed}%` }} />
                </div>

                <p className="text-xs text-gray-400">
                  Projected this month: <span className={`font-semibold ${s.text}`}>{fmtLKR(b.projected)}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}