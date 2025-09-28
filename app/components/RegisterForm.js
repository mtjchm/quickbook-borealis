"use client";
import { useState } from "react";

export default function RegisterForm({ onRegister, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validace
    if (formData.password !== formData.confirmPassword) {
      setError("Hesla se neshodují");
      return;
    }

    if (formData.password.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků");
      return;
    }

    setLoading(true);

    try {
      // Odeslání registrace na backend
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Chyba při registraci");
      }

      // Po úspěšné registraci automaticky přihlásit
      onRegister(data.data);
      
    } catch (e) {
      setError(e.message || "Chyba při registraci");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-sm w-full flex flex-col gap-3">
      <h2 className="text-xl font-bold mb-2">Registrace</h2>
      
      <div className="grid grid-cols-2 gap-2">
        <input 
          className="border px-2 py-1 rounded" 
          type="text" 
          name="firstName"
          placeholder="Jméno" 
          value={formData.firstName} 
          onChange={handleChange} 
          required 
        />
        <input 
          className="border px-2 py-1 rounded" 
          type="text" 
          name="lastName"
          placeholder="Příjmení" 
          value={formData.lastName} 
          onChange={handleChange} 
          required 
        />
      </div>
      
      <input 
        className="border px-2 py-1 rounded" 
        type="email" 
        name="email"
        placeholder="E-mail" 
        value={formData.email} 
        onChange={handleChange} 
        required 
      />
      
      <input 
        className="border px-2 py-1 rounded" 
        type="password" 
        name="password"
        placeholder="Heslo (min. 8 znaků)" 
        value={formData.password} 
        onChange={handleChange} 
        required 
        minLength={8}
      />
      
      <input 
        className="border px-2 py-1 rounded" 
        type="password" 
        name="confirmPassword"
        placeholder="Potvrdit heslo" 
        value={formData.confirmPassword} 
        onChange={handleChange} 
        required 
      />
      
      {error && <div className="text-red-600 text-sm">{error}</div>}
      
      <button 
        className="bg-green-600 text-white py-2 rounded mt-2 hover:bg-green-700 disabled:bg-gray-400" 
        type="submit" 
        disabled={loading}
      >
        {loading ? "Registruji..." : "Zaregistrovat se"}
      </button>
      
      <div className="text-center mt-3">
        <button 
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Už máte účet? Přihlaste se
        </button>
      </div>
    </form>
  );
}