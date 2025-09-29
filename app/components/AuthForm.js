"use client";
import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthForm({ onLogin }) {
  const [showLogin, setShowLogin] = useState(true);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    onLogin(userData);
  };

  if (showLogin) {
    return (
      <>
        <LoginForm onLogin={handleLogin} />
        <p className="text-sm">
          Nemáte účet?{" "}
          <button className="text-blue-600 underline" onClick={() => setShowLogin(false)}>
            Zaregistrujte se
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      <RegisterForm onRegister={handleLogin} onSwitchToLogin={() => setShowLogin(true)} />
      <p className="text-sm">
        Máte již účet?{" "}
        <button className="text-blue-600 underline" onClick={() => setShowLogin(true)}>
          Přihlaste se
        </button>
      </p>
    </>
  );
}