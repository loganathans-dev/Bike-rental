import fetch from 'node-fetch';

async function test() {
  const res = await fetch(`http://localhost:5001/api/health`);
  console.log('Backend health:', res.status);
}
test();
