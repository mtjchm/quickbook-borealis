"use client";
import { useState } from "react";

// company a user jsou objekty s id, user má navíc first_name, last_name, email...
export default function BookingForm({ company, user, onBook }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!company) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Odeslání rezervace na backend
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user.id,
          company_id: company.id,
          booking_date: date,
          start_time: startTime,
          customer_notes: customerNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Chyba při vytváření rezervace");
      onBook(data.data); // Přidej novou rezervaci do seznamu
      setDate(""); setStartTime(""); setCustomerNotes("");
    } catch (e) {
      setError(e.message || "Chyba při vytváření rezervace");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-xl w-full mb-6 flex flex-col gap-2">
      <h3 className="text-xl font-bold mb-2">Vytvořit rezervaci</h3>
      <input className="border px-2 py-1 rounded" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <input className="border px-2 py-1 rounded" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
      <textarea className="border px-2 py-1 rounded" placeholder="Poznámka pro poskytovatele" value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} />
      {error && <div className="text-red-600">{error}</div>}
      <button className="bg-blue-600 text-white py-2 rounded mt-2 hover:bg-blue-700" type="submit" disabled={loading}>
        {loading ? "Odesílám..." : "Rezervovat"}
      </button>
    </form>
  );
}