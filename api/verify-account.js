/**
 * Vercel Serverless Function Proxy for Bank Account Verification
 * Proxies POST requests to https://api.wtproject.space/vrf/verify.php
 * Resolves CORS limitations when deployed on Vercel
 */

export default async function handler(req, res) {
  // CORS Headers for browser clients
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    let bank_code = '';
    let account_number = '';

    // Handle parsed JSON body, urlencoded string, or query params
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        bank_code = parsed.bank_code || '';
        account_number = parsed.account_number || '';
      } catch {
        const params = new URLSearchParams(req.body);
        bank_code = params.get('bank_code') || '';
        account_number = params.get('account_number') || '';
      }
    } else if (req.body && typeof req.body === 'object') {
      bank_code = req.body.bank_code || '';
      account_number = req.body.account_number || '';
    }

    if (!bank_code || !account_number) {
      bank_code = (req.query && req.query.bank_code) || '';
      account_number = (req.query && req.query.account_number) || '';
    }

    if (!bank_code || !account_number) {
      return res.status(400).send('Error: Missing bank code or account number');
    }

    const formData = new URLSearchParams();
    formData.append('bank_code', String(bank_code).trim());
    formData.append('account_number', String(account_number).trim().replace(/\D/g, ''));

    const upstreamResponse = await fetch('https://api.wtproject.space/vrf/verify.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const resultText = (await upstreamResponse.text()).trim();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(resultText);
  } catch (error) {
    console.error('Vercel API proxy error:', error);
    return res.status(500).send('Error: Verification service temporarily unreachable');
  }
}
