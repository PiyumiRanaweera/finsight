import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/transactions", label: "Transactions", icon: "💸" },
  { path: "/categories", label: "Categories", icon: "🏷️" },
  { path: "/goals", label: "Goals", icon: "🎯" }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const initials = user?.fullName?.split(" ").map((w) => w[0]).slice(0, 2).join("") ?? "?";

  return (
    <div className="min-h-screen bg-surface lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-gray-100 min-h-screen sticky top-0 p-5">
        <div className="flex items-center gap-2 px-2 mb-8">
          <span className="text-2xl">💰</span>
          <span className="text-xl font-extrabold tracking-tight">FinSight</span>
        </div>

        <nav className="space-y-1 flex-1">
          {NAV.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.fullName}</p>
            <button onClick={logout} className="text-xs text-red-500 hover:underline cursor-pointer">
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-extrabold">💰 FinSight</span>
        <div className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-lg ${
                location.pathname === item.path ? "bg-brand-50" : ""
              }`}
              title={item.label}
            >
              {item.icon}
            </Link>
          ))}
          <button onClick={logout} className="px-2 text-sm text-red-500 cursor-pointer">⏻</button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 lg:px-10 py-8 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}