import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { errorMessage, fieldErrors } from "../api/errors";

export default function Register() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors({ ...errors, [field]: undefined }); // clear error as user types
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
      errors[field]
        ? "border-red-400 focus:ring-red-400"
        : "border-gray-200 focus:ring-blue-500"
    }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName);
      toast.success("Welcome to FinSight! 🎉");
      navigate("/");
    } catch (err) {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length > 0) {
        setErrors(fe); // inline, field by field
      } else {
        toast.error(errorMessage(err)); // e.g. "Email already registered"
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-10 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-1">💰 FinSight</h1>
        <p className="text-gray-500 text-center mb-6">Create your account</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <input className={inputClass("fullName")} placeholder="Full name"
              value={form.fullName} onChange={set("fullName")} />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>
          <div>
            <input className={inputClass("email")} type="email" placeholder="Email"
              value={form.email} onChange={set("email")} />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <input className={inputClass("password")} type="password" placeholder="Password (min 8 characters)"
              value={form.password} onChange={set("password")} />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <button
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            type="submit" disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
