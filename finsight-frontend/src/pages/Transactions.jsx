import { useEffect, useState } from "react";
import client from "../api/client";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    type: "EXPENSE",
    description: "",
    transactionDate: new Date().toISOString().split("T")[0],
    categoryId: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [txRes, catRes] = await Promise.all([
        client.get("/transactions"),
        client.get("/categories"),
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await client.post("/transactions", {
      ...form,
      amount: parseFloat(form.amount),
      categoryId: form.categoryId || null,
    });
    setShowForm(false);
    setForm({ ...form, amount: "", description: "", categoryId: "" });
    load();
  };

  const suggestCategory = async () => {
    if (!form.description) return;
    setSuggesting(true);
    try {
      const { data } = await client.post("/ai/suggest-category", {
        description: form.description,
      });
      if (data.category) {
        const match = categories.find((c) => c.name === data.category);
        if (match) setForm((f) => ({ ...f, categoryId: String(match.id) }));
      }
    } finally {
      setSuggesting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    await client.delete(`/transactions/${id}`);
    load();
  };

  const fmt = (n) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(n);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer"
        >
          {showForm ? "Cancel" : "+ Add Transaction"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm mb-6 grid grid-cols-2 gap-4">
          <input
            className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number" step="0.01" min="0.01" placeholder="Amount (LKR)"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <select
            className="border border-gray-200 rounded-lg px-4 py-2"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          <input
            className="border border-gray-200 rounded-lg px-4 py-2 col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <input
            className="border border-gray-200 rounded-lg px-4 py-2"
            type="date"
            value={form.transactionDate}
            onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
            required
          />
          <div className="flex gap-2">
            <select
              className="border border-gray-200 rounded-lg px-4 py-2 flex-1"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={suggestCategory}
              disabled={suggesting || !form.description}
              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 disabled:opacity-40 cursor-pointer whitespace-nowrap"
              title="Let AI suggest a category from the description"
            >
              {suggesting ? "..." : "✨ AI"}
            </button>
          </div>
          <button
            type="submit"
            className="col-span-2 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 cursor-pointer"
          >
            Save Transaction
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          No transactions yet. Add your first one!
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium">{tx.description}</p>
                <p className="text-sm text-gray-500">
                  {tx.transactionDate}
                  {tx.categoryName && (
                    <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                      {tx.categoryName}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-semibold ${tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                  {tx.type === "INCOME" ? "+" : "-"}{fmt(tx.amount)}
                </span>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="text-gray-400 hover:text-red-600 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}