'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard({ company, user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch(`/api/bookings?companyId=${company.id}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || 'Failed to fetch bookings');
        }
        setBookings(data.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [company.id]);

  const handleDelete = async (bookingId) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to delete booking');
      }
      setBookings(bookings.filter((b) => b.id !== bookingId));
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // roles are lowercase
  const isAdmin = user?.role === 'admin';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        {isAdmin && (
          <button
            onClick={() => router.push(`/company/${company.id}/edit`)}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Edit Company
          </button>
        )}
      </div>

      <h3 className="text-xl font-semibold mb-2">Bookings</h3>
      <div className="space-y-4">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking.id} className="p-4 border rounded-md">
              <p><strong>Customer:</strong> {booking.customer.first_name} {booking.customer.last_name}</p>
              <p><strong>Date:</strong> {new Date(booking.start_time).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {new Date(booking.start_time).toLocaleTimeString()} - {new Date(booking.end_time).toLocaleTimeString()}</p>
              <p><strong>Status:</strong> {booking.status}</p>
              <div className="mt-2">
                <button
                  onClick={() => alert('Update functionality not implemented yet.')}
                  className="bg-yellow-500 text-white py-1 px-3 rounded-md mr-2 hover:bg-yellow-600"
                >
                  Update
                </button>
                <button
                  onClick={() => handleDelete(booking.id)}
                  className="bg-red-600 text-white py-1 px-3 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No bookings found.</p>
        )}
      </div>
    </div>
  );
}
