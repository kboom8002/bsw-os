import { NextRequest } from 'next/server';
import { GET } from '../app/api/benchmark/config/route';

async function run() {
  const req = new NextRequest('http://localhost:3000/api/benchmark/config?domain=wedding_studio');
  const res = await GET(req);
  console.log(res.status);
  console.log(await res.text());
}
run();
