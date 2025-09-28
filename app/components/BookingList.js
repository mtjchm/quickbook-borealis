"use client";
import { useEffect, useState } from "react";

export default function BookingList({ user, company, refresh }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ companyId: String(company.id) });
      const headers = {};
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch(`/api/bookings?${params.toString()}`, { headers });
      const data = await res.json();
      // API returns an array of { startTime, endTime } for booked slots when called without auth
      // When authenticated for customer bookings we get BookingResponse objects; handle both.
      const out = Array.isArray(data.data) ? data.data : (data.data || []);
      setBookings(out || []);
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
          {bookings.map((b, i) => {
            // handle booked slot shape { startTime, endTime } or full booking object
            const bookingDate = b.booking_date ?? (b.startTime ? new Date(b.startTime).toISOString().slice(0,10) : '');
            const start = b.start_time ?? b.startTime ?? '';
            const notes = b.notes ?? b.customer_notes ?? '';
            const status = b.status ?? '';
            const serviceName = b.company?.service?.name ?? b.company?.name ?? '';
            const price = b.company?.service?.price ?? '';
            return (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-2">{bookingDate}</td>
                <td className="p-2">{start}</td>
                <td className="p-2">{notes}</td>
                <td className="p-2">{status}</td>
                <td className="p-2">{serviceName}</td>
                <td className="p-2">{price ? `${price} Kč` : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}