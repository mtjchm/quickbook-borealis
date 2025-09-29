'use client';

import { useState, useEffect } from 'react';
import CompanyEditForm from '../components/CompanyEditForm';

export default function CompanyEditPage({ params }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCompany() {
      try {
        const res = await fetch(`/api/companies/${params.id}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || 'Failed to fetch company data');
        }
        setCompany(data.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!company) return <div>Company not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <CompanyEditForm company={company} />
    </div>
  );
}
