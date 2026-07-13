import { useEffect, useState } from "react";
import client from "../api/client";
import toast from "react-hot-toast";
import { errorMessage } from "../api/errors";
import { emojiFor } from "../utils/format";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  

  const load = async () => {
    const { data } = await client.get("/categories");
    setCategories(data);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await client.post("/categories", { name });
      toast.success(`Category "${name}" added`);
      setName("");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span>Delete this transaction?</span>
        <button
          className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm cursor-pointer"
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await client.delete(`/transactions/${id}`);
              toast.success("Transaction deleted");
              load();
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        >
          Delete
        </button>
        <button
          className="text-gray-600 px-2 py-1 text-sm cursor-pointer"
          onClick={() => toast.dismiss(t.id)}
        >
          Cancel
        </button>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Categories</h1>

      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          className="flex-1 border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 cursor-pointer">
          Add
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        {categories.map((c) => (
          <div key={c.id} className="bg-white shadow-sm shadow-gray-200/50 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-lg">
              {emojiFor(c.name)}
            </div>
            <span className="font-semibold text-sm">{c.name}</span>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-gray-300 hover:text-red-500 cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}