/**
 * Vercel Serverless Function Proxy for Bank Account Verification
 * Sends POST application/x-www-form-urlencoded requests to https://api.wtproject.space/vrf/verify.php
 * with required parameters: bank_code and account_number
 */

export default async function handler(req, res) {
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
      bank_code = (req.query && req.query.bank_code) || bank_code || '';
      account_number = (req.query && req.query.account_number) || account_number || '';
    }

    const cleanCode = String(bank_code).trim();
    const cleanAcc = String(account_number).trim().replace(/\D/g, '');

    if (!cleanCode || !cleanAcc) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(400).send('Error: Missing bank code or account number');
    }

    const formData = new URLSearchParams();
    formData.append('bank_code', cleanCode);
    formData.append('account_number', cleanAcc);

    const upstreamResponse = await fetch('https://api.wtproject.space/vrf/verify.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const resultText = (await upstreamResponse.text()).trim();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(resultText || 'Error: Invalid Account');
  } catch (error) {
    console.error('API proxy error:', error);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(502).send('Error: Unable to reach verification server');
  }
}
