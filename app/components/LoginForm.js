"use client";
import { useState } from "react";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Odeslání loginu na backend
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Chybné přihlašovací údaje");

      // Backend by měl vracet uživatele (např. id, email, jméno)
      onLogin(data.data);
    } catch (e) {
      setError(e.message || "Chyba při přihlášení");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-xs w-full flex flex-col gap-2">
      <h2 className="text-xl font-bold mb-2">Přihlášení</h2>
      <input className="border px-2 py-1 rounded" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
      <input className="border px-2 py-1 rounded" type="password" placeholder="Heslo" value={password} onChange={e => setPassword(e.target.value)} required />
      {error && <div className="text-red-600">{error}</div>}
      <button className="bg-blue-600 text-white py-2 rounded mt-2 hover:bg-blue-700" type="submit" disabled={loading}>
        {loading ? "Přihlašuji..." : "Přihlásit se"}
      </button>
    </form>
  );
}