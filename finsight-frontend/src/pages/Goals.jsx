import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client";
import { errorMessage } from "../api/errors";
import { fmtLKR } from "../utils/format";

const EMOJIS = ["🚗", "🏠", "✈️", "💻", "📱", "🎓", "💍", "🛡️", "🎸", "🏖️"];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", emoji: "🚗", targetAmount: "", deadline: "" });

  const load = async () => {
    const { data } = await client.get("/goals");
    setGoals(data);
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await client.post("/goals", {
        ...form,
        targetAmount: parseFloat(form.targetAmount),
        deadline: form.deadline || null,
      });
      toast.success("Goal created 🎯");
      setShowForm(false);
      setForm({ name: "", emoji: "🚗", targetAmount: "", deadline: "" });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleAddMoney = (goal) => {
    const amount = prompt(`Add money to "${goal.name}" (LKR):`);
    if (!amount) return;
    client.post(`/goals/${goal.id}/add`, { amount: parseFloat(amount) })
      .then(() => { toast.success("Progress updated 💪"); load(); })
      .catch((err) => toast.error(errorMessage(err)));
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span>Delete this goal?</span>
        <button className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm cursor-pointer"
          onClick={async () => {
            toast.dismiss(t.id);
            try { await client.delete(`/goals/${id}`); toast.success("Goal deleted"); load(); }
            catch (err) { toast.error(errorMessage(err)); }
          }}>Delete</button>
        <button className="text-gray-600 px-2 text-sm cursor-pointer" onClick={() => toast.dismiss(t.id)}>Cancel</button>
      </div>
    ));
  };

  const input = "w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 cursor-pointer">
          {showForm ? "Cancel" : "+ Add Goal"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6 space-y-4 dark:bg-gray-800 dark:shadow-none">
          <input className={input} placeholder="Goal name (e.g. New Laptop)"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map((em) => (
              <button key={em} type="button" onClick={() => setForm({ ...form, emoji: em })}
                className={`w-11 h-11 rounded-xl text-xl cursor-pointer transition-colors ${
                  form.emoji === em ? "bg-violet-100 ring-2 ring-violet-500" : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-700/50"
                }`}>
                {em}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={input} type="number" min="1" step="0.01" placeholder="Target amount (LKR)"
              value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required />
            <input className={input} type="date"
              value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <button className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 cursor-pointer">
            Create Goal
          </button>
        </form>
      )}

      {goals.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-16 text-center dark:bg-gray-800 dark:shadow-none">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-500 font-medium">No goals yet</p>
          <p className="text-gray-400 text-sm">Create one and start saving toward it!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <div key={g.id} className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6 dark:bg-gray-800 dark:shadow-none">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl">
                    {g.emoji}
                  </div>
                  <div>
                    <p className="font-bold">{g.name}</p>
                    {g.deadline && <p className="text-xs text-gray-400">by {g.deadline}</p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(g.id)}
                  className="text-gray-300 hover:text-red-500 cursor-pointer">✕</button>
              </div>

              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold">{fmtLKR(g.savedAmount)}</span>
                <span className="text-gray-400">of {fmtLKR(g.targetAmount)}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4 dark:bg-gray-700">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all"
                  style={{ width: `${g.progressPercent}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-600">{g.progressPercent}% there</span>
                <button onClick={() => handleAddMoney(g)}
                  className="bg-violet-50 text-violet-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-100 cursor-pointer">
                  + Add money
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}