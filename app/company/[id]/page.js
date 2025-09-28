'use client';

import React, { useState, useEffect, use } from 'react';
import BookingForm from '../../components/BookingForm';

const CompanyPage = ({ params }) => {
  const rawid = React.use(params);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // In a real app, you'd get this from a global state/context

  useEffect(() => {
    const storedUserString = localStorage.getItem('user');
    const loggedInUser = storedUserString ? JSON.parse(storedUserString) : null;
    setUser(loggedInUser);

    const fetchCompany = async () => {
      try {
        const headers = {};
        if (loggedInUser?.token) {
          headers['Authorization'] = `Bearer ${loggedInUser.token}`;
        }

        const response = await fetch(`/api/companies/${rawid.id}`, { headers });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch company data');
        }
        
        const data = await response.json();
        setCompany(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [rawid.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!company) {
    return <div>Company not found</div>;
  }

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-100 py-8">
      <div className="w-full max-w-4xl px-4">
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-4xl font-bold mb-4">{company.name}</h1>
          {company.headerImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.headerImageUrl} alt={`${company.name} header`} className="w-full h-64 object-cover rounded-md mb-4" />
          )}
          <p className="text-gray-700 mb-4">{company.description}</p>
          <div className="text-sm text-gray-600">
            <p><strong>Service:</strong> {company.serviceName}</p>
            <p><strong>Address:</strong> {company.address}</p>
            <p><strong>Phone:</strong> {company.phone}</p>
            <p><strong>Email:</strong> {company.email}</p>
          </div>
        </div>
        
        {user ? (
          <BookingForm company={company} user={user} onBook={() => alert('Booking successful!')} />
        ) : (
          <div className="text-center bg-yellow-100 p-4 rounded-md">
            <p>Please log in to make a booking.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default CompanyPage;
