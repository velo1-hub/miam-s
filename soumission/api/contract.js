// Vercel serverless function: receives the contract PDF generated in the
// browser at signing time and emails it to Veloria Labs through Resend.
//
// Required environment variables (Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY   API key from resend.com
// Optional:
//   CONTRACT_TO      recipient (default hello@velorialabs.ca)
//   CONTRACT_FROM    verified sender (default "Veloria Labs <contrats@velorialabs.ca>")
//
// The recipient is fixed server-side, so this endpoint cannot be used to
// send mail to arbitrary addresses.

const MAX_PDF_BYTES = 3 * 1024 * 1024;

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\r\n<>]/g, ' ').slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: 'email_not_configured' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ ok: false, error: 'bad_json' }); }
  }
  body = body || {};

  const pdf = typeof body.pdf === 'string' ? body.pdf : '';
  if (!/^[A-Za-z0-9+/=]+$/.test(pdf) || pdf.length * 0.75 > MAX_PDF_BYTES) {
    return res.status(400).json({ ok: false, error: 'bad_pdf' });
  }
  if (!Buffer.from(pdf.slice(0, 8), 'base64').toString('latin1').startsWith('%PDF')) {
    return res.status(400).json({ ok: false, error: 'not_a_pdf' });
  }

  const name = clean(body.name, 80) || 'Client';
  const when = clean(body.when, 60);
  const hash = clean(body.hash, 64).replace(/[^a-f0-9]/gi, '');
  const total = clean(body.total, 40);
  const monthly = clean(body.monthly, 60);
  const services = Array.isArray(body.services) ? body.services.slice(0, 20).map((s) => clean(s, 80)) : [];
  const filename = clean(body.filename, 80).replace(/[^\w.\-]/g, '') || 'Contrat-VL-0002.pdf';

  const esc = (s) => s.replace(/&/g, '&amp;');
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111">
      <h2 style="margin:0 0 8px">Contrat signé · Soumission VL-0002</h2>
      <p><b>${esc(name)}</b> a signé la soumission le ${esc(when)}.</p>
      <p><b>Mise en place :</b> ${esc(total)}<br><b>Accompagnement mensuel :</b> ${esc(monthly || 'non')}</p>
      <p><b>Services :</b><br>${services.map(esc).join('<br>')}</p>
      <p style="font-family:monospace;font-size:12px;color:#555">SHA-256 : ${hash}</p>
      <p>Le contrat signé est joint en PDF.</p>
    </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CONTRACT_FROM || 'Veloria Labs <contrats@velorialabs.ca>',
      to: [process.env.CONTRACT_TO || 'hello@velorialabs.ca'],
      subject: `Contrat signé VL-0002 · ${name}`,
      html,
      attachments: [{ filename, content: pdf }],
    }),
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    console.error('resend_error', r.status, detail.slice(0, 300));
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
  return res.status(200).json({ ok: true });
};
