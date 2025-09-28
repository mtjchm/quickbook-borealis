'use client';

import Link from 'next/link';

const CompanyCard = ({ company }) => {
  return (
    <Link href={`/company/${company.id}`}>
      <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 cursor-pointer">
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{company.name}</h5>
        <p className="font-normal text-gray-700 dark:text-gray-400">{company.description}</p>
        <p className="text-sm text-gray-500 mt-4">{company.serviceName}</p>
      </div>
    </Link>
  );
};

export default CompanyCard;
