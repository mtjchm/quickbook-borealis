"use client";
import { useState } from "react";
import AuthForm from "./components/AuthForm";
import CompanyList from "./components/CompanyList";

export default function Home() {
  // user will be the tokenResponse returned by /api/auth/login: { user: {...}, token: '...' }
  const [user, setUser] = useState(null);

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-2 bg-gray-100 py-8">
        <h1 className="text-3xl font-bold mb-4">QuickBook Borealis – Rezervační systém</h1>
        <AuthForm onLogin={setUser} />
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-100 py-8">
      <div className="w-full max-w-6xl px-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">QuickBook Borealis</h1>
          <div className="text-sm">
            Přihlášen jako: <span className="font-semibold">{user?.user?.email ?? "unknown"}</span>
            <button className="ml-2 text-blue-600 underline" onClick={() => setUser(null)}>Odhlásit</button>
          </div>
        </div>
        <CompanyList />
      </div>
    </main>
  );
}