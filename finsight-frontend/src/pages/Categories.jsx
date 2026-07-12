import { useEffect, useState } from "react";
import client from "../api/client";
import toast from "react-hot-toast";
import { errorMessage } from "../api/errors";

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
    <div>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          className="border border-gray-200 rounded-lg px-4 py-2 flex-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 cursor-pointer">
          Add
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        {categories.map((c) => (
          <div key={c.id} className="bg-white shadow-sm rounded-full px-4 py-2 flex items-center gap-2">
            <span>{c.name}</span>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-gray-400 hover:text-red-600 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}