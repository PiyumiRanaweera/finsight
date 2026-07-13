import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { dark, toggle } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm shadow-gray-200/50 dark:shadow-none p-6">
        <h2 className="font-bold mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Dark mode</p>
            <p className="text-sm text-gray-400">Easier on the eyes at night</p>
          </div>
          <button
            onClick={toggle}
            className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${
              dark ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"
            }`}
            aria-label="Toggle dark mode"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white dark:bg-gray-800 shadow transition-transform ${
                dark ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm shadow-gray-200/50 dark:shadow-none p-6">
        <h2 className="font-bold mb-2">About</h2>
        <p className="text-sm text-gray-400">
          FinSight v2 — AI-powered personal finance tracker.
          Built with Spring Boot, React & Gemini AI by Piyumi Ranaweera.
        </p>
      </div>
    </div>
  );
}