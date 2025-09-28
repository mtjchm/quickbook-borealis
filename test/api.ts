import axios from 'axios';
import assert from 'assert';


const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function testBookingsPublic(companyId: number) {
  const url = `${BASE}/api/bookings?id=${companyId}`;
  const res = await axios.get(url).then((r) => r.data);
  assert(res.success === true, 'expected success true');
  assert(Array.isArray(res.data), 'data should be an array');
  console.log(`bookings?id=${companyId} -> ${res.data.length} slots`);
}

async function testCompanyRead(companyId: number, token?: string) {
  const url = `${BASE}/api/companies/${companyId}`;
  const headers: any = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await axios.get(url, { headers }).then((r) => r.data);
    console.log(`companies/${companyId} -> success:`, res.success);
    return res;
  } catch (err: any) {
    if (err.response) {
      console.log(`companies/${companyId} -> status ${err.response.status}`, err.response.data);
      return err.response.data;
    }
    throw err;
  }
}

async function run() {
  try {
    // test bookings public endpoint for company id 1 and 2 (from seed.ts data)
    await testBookingsPublic(1);
    await testBookingsPublic(2);

    // Test company GET but unauthorized; should be 401 
    await testCompanyRead(1);

    console.log('ok');
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
  }
}

run();