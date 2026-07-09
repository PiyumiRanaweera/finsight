import { useEffect, useState } from "react";
import client from "../api/client";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await client.get("/categories");
    setCategories(data);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/categories", { name });
      setName("");
      load();
    } catch (err) {
      setError(err.response?.status === 409 ? "Category already exists" : "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category? Its transactions will become uncategorized.")) return;
    await client.delete(`/categories/${id}`);
    load();
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

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

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