"use client";
import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthForm({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);

  function handleRegister(userData) {
    // Po úspěšné registraci automaticky přihlásit uživatele
    onLogin(userData);
  }

  return (
    <div className="flex flex-col items-center">
      {isLoginMode ? (
        <div>
          <LoginForm onLogin={onLogin} />
          <div className="text-center mt-4">
            <button 
              onClick={() => setIsLoginMode(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Nemáte účet? Zaregistrujte se
            </button>
          </div>
        </div>
      ) : (
        <RegisterForm 
          onRegister={handleRegister}
          onSwitchToLogin={() => setIsLoginMode(true)}
        />
      )}
    </div>
  );
}