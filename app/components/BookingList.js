"use client";
import { useEffect, useState } from "react";

export default function BookingList({ user, company, refresh }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/bookings?customer_id=${user.id}&company_id=${company.id}`);
      const data = await res.json();
      setBookings(data.data || []);
      setLoading(false);
    }
    if (user && company) load();
  }, [user, company, refresh]);

  if (loading) return <div>Načítám rezervace...</div>;
  if (!bookings.length) return <div className="text-gray-500 mt-4">Žádné rezervace zatím nejsou.</div>;

  return (
    <div className="mt-6 w-full max-w-2xl">
      <h2 className="font-bold text-lg mb-2">Moje rezervace</h2>
      <table className="w-full border-collapse bg-white rounded shadow">
        <thead>
          <tr>
            <th className="border-b p-2 text-left">Datum</th>
            <th className="border-b p-2 text-left">Začátek</th>
            <th className="border-b p-2 text-left">Poznámka</th>
            <th className="border-b p-2 text-left">Stav</th>
            <th className="border-b p-2 text-left">Služba</th>
            <th className="border-b p-2 text-left">Cena</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="p-2">{b.booking_date}</td>
              <td className="p-2">{b.start_time}</td>
              <td className="p-2">{b.customer_notes}</td>
              <td className="p-2">{b.status}</td>
              <td className="p-2">{b.company?.service?.name}</td>
              <td className="p-2">{b.company?.service?.price} Kč</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}