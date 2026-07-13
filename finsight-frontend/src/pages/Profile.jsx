import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client";
import { errorMessage, fieldErrors } from "../api/errors";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await client.get("/me");
      setProfile(data);
      setFullName(data.fullName);
    })();
  }, []);

  const saveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      const { data } = await client.put("/me", { fullName });
      setProfile(data);
      // update localStorage so the sidebar reflects the change after refresh
      const saved = JSON.parse(localStorage.getItem("user") ?? "{}");
      localStorage.setItem("user", JSON.stringify({ ...saved, fullName: data.fullName }));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwErrors({});
    setSavingPw(true);
    try {
      await client.post("/me/change-password", pw);
      toast.success("Password changed 🔒");
      setPw({ currentPassword: "", newPassword: "" });
    } catch (err) {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length > 0) setPwErrors(fe);
      else toast.error(errorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  const input = "w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
  const initials = profile?.fullName?.split(" ").map((w) => w[0]).slice(0, 2).join("") ?? "?";

  if (!profile) return <p className="text-gray-400">Loading...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      {/* Identity card */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-500 to-violet-700 rounded-3xl p-7 text-white flex items-center gap-5 shadow-lg shadow-violet-600/20">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-extrabold">
          {initials}
        </div>
        <div className="flex-1">
          <p className="text-xl font-bold">{profile.fullName}</p>
          <p className="text-white/70 text-sm">{profile.email}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-white/70">Member since</p>
          <p className="font-semibold">{profile.memberSince}</p>
          <p className="text-white/70 mt-1">{profile.transactionCount} transactions</p>
        </div>
      </div>

      {/* Edit name */}
      <form onSubmit={saveName} className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6 space-y-4">
        <h2 className="font-bold">Personal details</h2>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">Full name</label>
          <input className={input} value={fullName}
            onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <button disabled={savingName}
          className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 cursor-pointer">
          {savingName ? "Saving..." : "Save changes"}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={savePassword} className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6 space-y-4">
        <h2 className="font-bold">Change password</h2>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">Current password</label>
          <input className={input} type="password" value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">New password</label>
          <input className={input} type="password" value={pw.newPassword}
            onChange={(e) => { setPw({ ...pw, newPassword: e.target.value }); setPwErrors({}); }} required />
          {pwErrors.newPassword && <p className="text-red-500 text-sm mt-1">{pwErrors.newPassword}</p>}
        </div>
        <button disabled={savingPw}
          className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 cursor-pointer">
          {savingPw ? "Changing..." : "Change password"}
        </button>
      </form>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl shadow-sm shadow-gray-200/50 p-6 flex items-center justify-between">
        <div>
          <h2 className="font-bold">Sign out</h2>
          <p className="text-sm text-gray-400">Log out of FinSight on this device</p>
        </div>
        <button onClick={logout}
          className="border border-red-200 text-red-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 cursor-pointer">
          Log out
        </button>
      </div>
    </div>
  );
}