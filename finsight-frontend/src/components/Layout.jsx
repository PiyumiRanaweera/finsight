import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLink = (path, label) => (
    <Link
      to={path}
      className={`px-3 py-2 rounded-lg text-sm font-medium ${
        location.pathname === path
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold">💰 FinSight</span>
          <div className="flex gap-2">
            {navLink("/", "Dashboard")}
            {navLink("/transactions", "Transactions")}
            {navLink("/categories", "Categories")}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.fullName}</span>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg cursor-pointer"
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}