export const sendWithResend = async ({ subject, html, to, from, apiKey }) => {
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend error: ${message}`);
  }

  return response.json();
};
