export const CATEGORY_EMOJI = {
  food: "🍔", groceries: "🛒", transport: "🚕", entertainment: "🎬",
  shopping: "🛍️", bills: "🧾", health: "💊", education: "📚",
  salary: "💼", rent: "🏠", travel: "✈️",
};

export const emojiFor = (name) => CATEGORY_EMOJI[name?.toLowerCase()] ?? "💠";

export const fmtLKR = (n) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency", currency: "LKR", maximumFractionDigits: 0,
  }).format(n);

export const friendlyDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
};