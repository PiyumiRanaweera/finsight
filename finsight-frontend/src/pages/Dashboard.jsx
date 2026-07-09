import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome back, {user?.fullName}! 👋</h1>
      <p>Your dashboard is coming soon.</p>
      <button onClick={logout} style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}>
        Log out
      </button>
    </div>
  );
}