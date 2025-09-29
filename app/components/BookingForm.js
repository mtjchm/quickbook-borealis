'use client';

import { useState } from 'react';

export default function BookingForm({ company, onBook }) {
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!bookingDate || !startTime) {
      setError('Please select a date and time.');
      setLoading(false);
      return;
    }

    const startDateTime = new Date(`${bookingDate}T${startTime}`);
    // assume 1 hour
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          companyId: company.id,
          bookingDate: startDateTime.toISOString(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes: notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Booking failed');
      }

      if (onBook) {
        onBook(data.data);
      }
    } catch (e) {
      setError(e.message || 'An error occurred during booking.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-4">Make a Booking</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700">Date</label>
          <input
            id="booking-date"
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">Time</label>
          <input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Booking...' : 'Book Now'}
      </button>
    </form>
  );
}
