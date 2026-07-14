import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client";
import { errorMessage } from "../api/errors";

const EMPTY = {
  amount: "", type: "EXPENSE", description: "",
  transactionDate: new Date().toISOString().split("T")[0], categoryId: "",
};

export default function TransactionModal({ open, onClose, onSaved, categories, editing }) {
  const [form, setForm] = useState(EMPTY);
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        amount: String(editing.amount),
        type: editing.type,
        description: editing.description,
        transactionDate: editing.transactionDate,
        categoryId: editing.categoryId ? String(editing.categoryId) : "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [editing, open]);

  if (!open) return null;

  const suggestCategory = async () => {
    if (!form.description) return;
    setSuggesting(true);
    try {
      const { data } = await client.post("/ai/suggest-category", { description: form.description });
      if (data.category) {
        const match = categories.find((c) => c.name === data.category);
        if (match) setForm((f) => ({ ...f, categoryId: String(match.id) }));
      }
    } catch (err) {
      toast.error(errorMessage(err, "AI suggestion failed"));
    } finally {
      setSuggesting(false);
    }
  };

  const handleReceiptScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }

    setScanning(true);
    try {
      // Read file as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data } = await client.post("/ai/scan-receipt", {
        image: base64,
        mimeType: file.type,
      });

      // Pre-fill the form with whatever was extracted
      const match = data.category
        ? categories.find((c) => c.name === data.category)
        : null;

      setForm((f) => ({
        ...f,
        amount: data.amount != null ? String(data.amount) : f.amount,
        description: data.merchant ?? f.description,
        transactionDate: data.date ?? f.transactionDate,
        categoryId: match ? String(match.id) : f.categoryId,
        type: "EXPENSE",
      }));
      toast.success("Receipt scanned! Check the details 🧾");
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't read the receipt"));
    } finally {
      setScanning(false);
      e.target.value = ""; // allow re-selecting the same file
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount), categoryId: form.categoryId || null };
    try {
      if (editing) {
        await client.put(`/transactions/${editing.id}`, payload);
        toast.success("Transaction updated");
      } else {
        await client.post("/transactions", payload);
        toast.success("Transaction added");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-700 dark:text-gray-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md p-7">
        <h2 className="text-xl font-bold mb-5 dark:text-gray-100">
          {editing ? "Edit Transaction" : "Add Transaction"}
        </h2>

        {!editing && (
          <label className={`flex items-center justify-center gap-2 mb-4 py-3 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-800 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/50 cursor-pointer transition-colors ${scanning ? "opacity-50 pointer-events-none" : ""}`}>
            {scanning ? "📸 Reading receipt..." : "📸 Scan a receipt"}
            <input type="file" accept="image/*" capture="environment"
              className="hidden" onChange={handleReceiptScan} />
          </label>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input className={input} type="number" step="0.01" min="0.01" placeholder="Amount (LKR)"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <select className={input} value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>

          <input className={input} placeholder="Description"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />

          <div className="grid grid-cols-2 gap-3">
            <input className={input} type="date" value={form.transactionDate}
              onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} required />
            <div className="flex gap-2">
              <select className={`${input} flex-1`} value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="button" onClick={suggestCategory} disabled={suggesting || !form.description}
                className="px-3 rounded-xl bg-brand-50 dark:bg-violet-950 text-brand-700 dark:text-violet-300 text-sm font-semibold hover:bg-brand-100 dark:hover:bg-violet-900 disabled:opacity-40 cursor-pointer"
                title="AI suggest">
                {suggesting ? "..." : "✨"}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 cursor-pointer">
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}