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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 cursor-pointer"
        >
          + Add Transaction
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-16 text-center">
          <p className="text-4xl mb-3">💸</p>
          <p className="text-gray-500 font-medium">No transactions yet</p>
          <p className="text-gray-400 text-sm">Add your first one to get started!</p>
        </div>
      ) : (
        sortedDates.map((date) => (
          <div key={date}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {friendlyDate(date)}
            </p>
            <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 divide-y divide-gray-50">
              {groups[date].map((tx) => (
                <div key={tx.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 cursor-pointer transition-colors group"
                  onClick={() => { setEditing(tx); setModalOpen(true); }}
                >
                  <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-xl shrink-0">
                    {tx.type === "INCOME" ? "💼" : emojiFor(tx.categoryName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{tx.description}</p>
                    <p className="text-xs text-gray-400">{tx.categoryName ?? "Uncategorized"}</p>
                  </div>
                  <span className={`font-bold text-sm ${tx.type === "INCOME" ? "text-emerald-600" : "text-gray-800"}`}>
                    {tx.type === "INCOME" ? "+" : "-"}{fmtLKR(tx.amount)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer px-1"
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
    </div>
  );
}