"use client";
import { useState } from "react";
import LoginForm from "./components/LoginForm";
import BookingForm from "./components/BookingForm";
import BookingList from "./components/BookingList";

// Staticky popsaná firma – můžeš načítat z API podle potřeby!
const COMPANY = {
  id: 1,
  name: "Beautiful Hair Salon",
  address: "123 Main St, Downtown",
  phone: "555-0123",
  email: "contact@beautifulhair.com",
  service: {
    name: "Haircut & Style",
    duration_minutes: 60,
    price: "65.00",
  }
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [refresh, setRefresh] = useState(0);

  function handleBook() {
    setRefresh(r => r + 1); // Přenačte BookingList po nové rezervaci
  }

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-2 bg-gray-100 py-8">
        <h1 className="text-3xl font-bold mb-4">{COMPANY.name} – Rezervační systém</h1>
        <LoginForm onLogin={setUser} />
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-2 bg-gray-100 py-8">
      <h1 className="text-3xl font-bold mb-4">{COMPANY.name} – Rezervace</h1>
      <div className="bg-white p-4 rounded shadow mb-4 max-w-xl w-full text-gray-700">
        <div className="font-bold">{COMPANY.service.name}</div>
        <div>{COMPANY.service.duration_minutes} minut | {COMPANY.service.price} Kč</div>
        <div className="text-sm">Adresa: {COMPANY.address}</div>
        <div className="text-sm">Telefon: {COMPANY.phone}</div>
        <div className="text-sm">E-mail: {COMPANY.email}</div>
      </div>
      <div className="self-end text-sm mb-4">
        Přihlášen jako: <span className="font-semibold">{user.email}</span>{" "}
        <button className="ml-2 text-blue-600 underline" onClick={() => setUser(null)}>Odhlásit</button>
      </div>
      <BookingForm company={COMPANY} user={user} onBook={handleBook} />
      <BookingList user={user} company={COMPANY} refresh={refresh} />
    </main>
  );
}jgh 