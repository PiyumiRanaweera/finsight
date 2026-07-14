import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client";
import { errorMessage } from "../api/errors";
import { emojiFor, fmtLKR, friendlyDate } from "../utils/format";
import TransactionModal from "../components/TransactionModal";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleCsvSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const { data } = await client.post("/import/preview", { csv: text });
      setImportPreview(data);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't parse that CSV"));
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      const { data } = await client.post("/import/confirm", { rows: importPreview });
      toast.success(`Imported ${data.imported} transactions 🎉`);
      setImportPreview(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setImporting(false);
    }
  };

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

  useEffect(() => { void load(); }, []);

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span>Delete this transaction?</span>
        <button className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm cursor-pointer"
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await client.delete(`/transactions/${id}`);
              toast.success("Transaction deleted");
              load();
            } catch (err) { toast.error(errorMessage(err)); }
          }}>
          Delete
        </button>
        <button className="text-gray-600 px-2 py-1 text-sm cursor-pointer" onClick={() => toast.dismiss(t.id)}>
          Cancel
        </button>
      </div>
    ));
  };

  // Group by date
  const groups = transactions.reduce((acc, tx) => {
    (acc[tx.transactionDate] ??= []).push(tx);
    return acc;
  }, {});
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
          <label className="border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-50 dark:hover:bg-violet-950/50 cursor-pointer">
            {importing && !importPreview ? "Parsing..." : "📄 Import CSV"}
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvSelect} />
          </label>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 cursor-pointer"
          >
            + Add Transaction
          </button>
        </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm shadow-gray-200/50 dark:shadow-none p-16 text-center">
          <p className="text-4xl mb-3">💸</p>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions yet</p>
          <p className="text-gray-400 text-sm">Add your first one to get started!</p>
        </div>
      ) : (
        sortedDates.map((date) => (
          <div key={date}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {friendlyDate(date)}
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm shadow-gray-200/50 dark:shadow-none divide-y divide-gray-50 dark:divide-gray-700">
              {groups[date].map((tx) => (
                <div key={tx.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/40 cursor-pointer transition-colors group"
                  onClick={() => { setEditing(tx); setModalOpen(true); }}
                >
                  <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-violet-950 flex items-center justify-center text-xl shrink-0">
                    {tx.type === "INCOME" ? "💼" : emojiFor(tx.categoryName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{tx.description}</p>
                    <p className="text-xs text-gray-400">{tx.categoryName ?? "Uncategorized"}</p>
                  </div>
                  <span className={`font-bold text-sm ${
                    tx.type === "INCOME"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-800 dark:text-gray-100"
                  }`}>
                    {tx.type === "INCOME" ? "+" : "-"}{fmtLKR(tx.amount)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                    className="text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        categories={categories}
        editing={editing}
      />

      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setImportPreview(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-2xl p-7 max-h-[85vh] flex flex-col">
            <h2 className="text-xl font-bold mb-1 dark:text-gray-100">Import Preview</h2>
            <p className="text-sm text-gray-400 mb-4">
              {importPreview.length} transactions found — AI has suggested categories. Review, then confirm.
            </p>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700 -mx-2">
              {importPreview.map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2.5 text-sm">
                  <span className="text-gray-400 text-xs w-20 shrink-0">{row.date}</span>
                  <span className="flex-1 truncate font-medium">{row.description}</span>
                  <span className="text-xs bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full shrink-0">
                    {row.categoryName ?? "—"}
                  </span>
                  <span className={`font-semibold shrink-0 ${row.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "dark:text-gray-100"}`}>
                    {row.type === "INCOME" ? "+" : "-"}{fmtLKR(row.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setImportPreview(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmImport} disabled={importing}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 cursor-pointer">
                {importing ? "Importing..." : `Import ${importPreview.length} transactions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}