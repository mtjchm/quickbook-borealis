'use client';

import React, { use, useState, useEffect } from 'react';
import BookingForm from '../../components/BookingForm';
import AdminDashboard from '../../components/AdminDashboard';

const CompanyPage = ({ params }) => {
  const rawId = use(params);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      try {
        // Fetch user session (include credentials so HttpOnly cookie is sent)
        const userRes = await fetch('/api/auth/me', { credentials: 'include' });
        let loggedInUser = null;
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success) {
            loggedInUser = userData.data.user;
            setUser(loggedInUser);
          }
        }

        // Fetch company data
        const companyRes = await fetch(`/api/companies/${params.id}`);
        if (!companyRes.ok) {
          const errorData = await companyRes.json();
          throw new Error(errorData.error?.message || 'Failed to fetch company data');
        }
        const companyData = await companyRes.json();
        setCompany(companyData.data);

        // Fetch employees for the company (public info)
        try {
          const empRes = await fetch(`/api/companies/${params.id}/employees`);
          if (empRes.ok) {
            const empData = await empRes.json();
            if (empData.success) setEmployees(empData.data.employees || []);
          }
        } catch (e) {
          // don't block page if employees fail to load
          console.error('Failed to fetch employees', e);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, rawId.id);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!company) {
    return <div>Company not found</div>;
  }

  // Roles are stored as lowercase strings (see lib/types). Normalize/case-check accordingly.
  const isProviderOrAdmin = user && (user.role === 'provider' || user.role === 'admin');

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
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-2">Employees</h2>
          {employees && employees.length > 0 ? (
            <ul className="space-y-2">
              {employees.map(emp => (
                <li key={emp.id} className="p-2 border rounded">
                  <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                  <p className="text-sm text-gray-600">{emp.email}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No employees listed.</p>
          )}
        </div>
        
        {isProviderOrAdmin ? (
          <AdminDashboard company={company} user={user} />
        ) : user ? (
          <BookingForm company={company} onBook={() => alert('Booking successful!')} />
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
