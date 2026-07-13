import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/transactions", label: "Transactions", icon: "💸" },
  { path: "/categories", label: "Categories", icon: "🏷️" },
  { path: "/goals", label: "Goals", icon: "🎯" },
  { path: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const initials = user?.fullName?.split(" ").map((w) => w[0]).slice(0, 2).join("") ?? "?";

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-900 dark:text-gray-100 lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 min-h-screen sticky top-0 p-5">
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
                    ? "bg-brand-50 text-brand-700 dark:bg-violet-950 dark:text-violet-300"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400">View profile</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-extrabold">💰 FinSight</span>
        <div className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-lg ${
                location.pathname === item.path ? "bg-brand-50 dark:bg-violet-950" : ""
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