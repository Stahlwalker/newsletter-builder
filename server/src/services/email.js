import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate unsubscribe token (same logic as in subscribers.js)
function generateUnsubscribeToken(subscriberId, email) {
  const secret = process.env.RESEND_API_KEY || 'fallback-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(`${subscriberId}:${email}`)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Generate HTML email from newsletter data using your design system
 */
function renderNewsletterHTML(newsletterData, subscriberInfo = null) {
  const { title, month, heroImageUrl, introContent, sections = [], signoffContent } = newsletterData;
  const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5050';

  const noBlurbSections = ['Technology was a mistake', 'Technical & Developer Marketing Jobs', 'Folks to follow'];
  const authorOnlySections = ['Technology was a mistake'];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Inter, Arial, sans-serif; }
    .container { max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
    .header { padding: 40px 40px 32px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; position: relative; }
    .header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #60a5fa 0%, #a855f7 100%); }
    .header-title { font-family: 'Fira Code', monospace; font-size: 28px; font-weight: 700; color: #ffffff; margin: 0 0 4px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header-month { font-size: 14px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.1em; margin: 0; }
    .hero-image { width: 100%; max-width: 680px; height: auto; display: block; }
    .section { padding: 32px 40px; }
    .section-header { display: flex; align-items: center; margin-bottom: 24px; position: relative; padding-bottom: 12px; }
    .section-header::after { content: ''; position: absolute; bottom: 0; left: 0; width: 60px; height: 3px; background: linear-gradient(90deg, #60a5fa 0%, #a855f7 100%); border-radius: 2px; }
    .section-title { font-family: 'Fira Code', monospace; font-size: 20px; font-weight: 600; color: #111827; margin: 0; position: relative; }
    .section-title::before { content: '//'; color: #60a5fa; margin-right: 8px; opacity: 0.6; }
    .intro-text { font-size: 16px; line-height: 1.7; color: #374151; margin: 0 0 16px 0; }
    .item { margin-bottom: 28px; padding: 16px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #60a5fa; transition: all 0.2s ease; }
    .item:hover { background: #f1f5f9; border-left-color: #a855f7; }
    .item-with-image { display: flex; gap: 16px; align-items: center; }
    .item-thumbnail { width: 160px; height: 80px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
    .item-content { flex: 1; min-width: 0; }
    .item-title { font-size: 18px; font-weight: 600; line-height: 1.4; margin: 0 0 8px 0; }
    .item-link { color: #4338ca; text-decoration: none; transition: color 0.2s ease; }
    .item-link:hover { color: #a855f7; text-decoration: none; }
    .item-blurb { font-size: 16px; line-height: 1.6; color: #374151; margin: 0; display: block; }
    .item-author { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 8px 0 0 0; font-weight: 500; }
    .divider { border: 0; border-top: 1px solid #e5e7eb; margin: 0; }
    .footer { padding: 32px 40px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); text-align: center; color: #e2e8f0; }
    .footer-text { font-size: 14px; color: #cbd5e1; margin: 0 0 8px 0; line-height: 1.5; }
    .footer-link { color: #60a5fa; text-decoration: none; transition: color 0.2s ease; }
    .footer-link:hover { color: #a855f7; }
    .social-icons { margin: 16px 0; }
    .social-link { display: inline-block; margin: 0 12px; text-decoration: none; transition: transform 0.2s ease; }
    .social-link:hover { transform: translateY(-2px); }
    .social-icon { width: 32px; height: 32px; display: inline-block; }

    /* Mobile responsive styles */
    @media only screen and (max-width: 600px) {
      body { padding: 10px !important; }
      .container { border-radius: 4px !important; }
      .header { padding: 24px 20px 20px 20px !important; }
      .header-title { font-size: 24px !important; }
      .header-month { font-size: 12px !important; }
      .section { padding: 24px 20px !important; }
      .section-title { font-size: 18px !important; }
      .section-title::before { margin-right: 6px !important; }
      .intro-text { font-size: 15px !important; line-height: 1.6 !important; }
      .item { margin-bottom: 20px !important; padding: 12px !important; }
      .item-with-image { flex-direction: column !important; }
      .item-thumbnail { width: 100% !important; height: auto !important; max-height: 200px !important; }
      .item-title { font-size: 16px !important; }
      .item-blurb { font-size: 15px !important; }
      .item-author { font-size: 12px !important; }
      .footer { padding: 24px 20px !important; }
      .footer-text { font-size: 13px !important; }
      .social-link { margin: 0 8px !important; }
      .social-icon { width: 28px !important; height: 28px !important; }
    }

    @media only screen and (max-width: 400px) {
      .header-title { font-size: 22px !important; }
      .section-title { font-size: 16px !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-title">${title}</h1>
      <p class="header-month">${month}</p>
    </div>

    ${heroImageUrl ? `
    <img src="${heroImageUrl}" alt="Newsletter hero" class="hero-image">
    <hr class="divider">
    ` : ''}

    ${introContent ? `
    <div class="section">
      <p class="intro-text">${introContent}</p>
    </div>
    <hr class="divider">
    ` : ''}

    ${sections.map((section, idx) => {
      if (!section.items || section.items.length === 0) return '';

      const needsBlurb = !noBlurbSections.includes(section.name);
      const showAuthor = needsBlurb || authorOnlySections.includes(section.name);

      return `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">${section.name}</h2>
      </div>
      ${section.items.map(item => `
      <div class="item ${item.imageUrl && section.name === 'Blogs & Projects' ? 'item-with-image' : ''}">
        ${item.imageUrl && section.name === 'Blogs & Projects' ? `<img src="${item.imageUrl}" alt="${item.title}" class="item-thumbnail">` : ''}
        <div class="item-content">
          <h3 class="item-title">
            <a href="${item.url}" class="item-link">${item.title}</a>
          </h3>
          ${needsBlurb && item.blurb ? `<p class="item-blurb">${item.blurb}</p>` : ''}
          ${showAuthor && item.author ? `<p class="item-author">${item.author}</p>` : ''}
        </div>
      </div>
      `).join('')}
      ${section.name === 'Links I like' ? `
      <div style="margin-top: 24px; text-align: center;">
        <a href="https://yourdomain.com/archive/" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; transition: transform 0.2s ease;">
          More Content →
        </a>
      </div>
      ` : ''}
    </div>
    ${idx < sections.filter(s => s.items && s.items.length > 0).length - 1 ? '<hr class="divider">' : ''}
      `;
    }).join('')}

    ${signoffContent ? `
    <hr class="divider">
    <div class="section">
      <p class="intro-text">${signoffContent}</p>
    </div>
    ` : ''}

    <div class="footer">
      <div class="social-icons">
        <a href="https://x.com/yourusername" class="social-link" title="X (Twitter)">
          <img src="${baseUrl}/public/assets/X-twitter.png" alt="X (Twitter)" class="social-icon">
        </a>
        <a href="https://www.linkedin.com/in/yourusername/" class="social-link" title="LinkedIn">
          <img src="${baseUrl}/public/assets/LinkedIn.png" alt="LinkedIn" class="social-icon">
        </a>
        <a href="https://github.com/yourusername" class="social-link" title="GitHub">
          <img src="${baseUrl}/public/assets/GitHub.png" alt="GitHub" class="social-icon">
        </a>
      </div>
      <p class="footer-text">
        <a href="https://yourdomain.com" class="footer-link">yourdomain.com</a>
      </p>
      ${subscriberInfo ? `
      <p class="footer-text" style="margin-top: 12px; font-size: 12px; opacity: 0.8;">
        <a href="${baseUrl}/api/subscribers/unsubscribe?id=${subscriberInfo.id}&token=${subscriberInfo.unsubscribeToken}" class="footer-link" style="color: #94a3b8;">Unsubscribe</a>
      </p>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send newsletter to all verified subscribers via Resend
 */
export async function sendNewsletterToSubscribers(newsletter, subscribers) {
  const verifiedSubscribers = subscribers.filter(sub => sub.verified_at);

  if (verifiedSubscribers.length === 0) {
    throw new Error('No verified subscribers to send to');
  }

  const results = await Promise.allSettled(
    verifiedSubscribers.map(subscriber => {
      const unsubscribeToken = generateUnsubscribeToken(subscriber.id, subscriber.email);
      const emailHtml = renderNewsletterHTML({
        title: newsletter.title,
        month: newsletter.month,
        heroImageUrl: newsletter.heroImageUrl,
        introContent: newsletter.introContent,
        sections: newsletter.sections || [],
        signoffContent: newsletter.signoffContent
      }, {
        id: subscriber.id,
        email: subscriber.email,
        unsubscribeToken
      });

      return resend.emails.send({
        from: process.env.RESEND_FROM,
        to: subscriber.email,
        subject: newsletter.title,
        html: emailHtml,
        tags: [
          { name: 'newsletter_id', value: newsletter.id.toString() },
          { name: 'type', value: 'newsletter' }
        ],
        trackClicks: true,
        trackOpens: true
      });
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return { total: verifiedSubscribers.length, successful, failed, results };
}

/**
 * Send test email to a single address
 */
export async function sendTestEmail(newsletter, testEmail) {
  // Mock subscriber info for test email
  const mockSubscriber = {
    id: 0,
    email: testEmail,
    unsubscribeToken: generateUnsubscribeToken(0, testEmail)
  };

  const emailHtml = renderNewsletterHTML({
    title: `[TEST] ${newsletter.title}`,
    month: newsletter.month,
    heroImageUrl: newsletter.heroImageUrl,
    introContent: newsletter.introContent,
    sections: newsletter.sections || [],
    signoffContent: newsletter.signoffContent
  }, mockSubscriber);

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: testEmail,
    subject: `[TEST] ${newsletter.title}`,
    html: emailHtml,
    tags: [{ name: 'type', value: 'test' }],
    trackClicks: true,
    trackOpens: true
  });

  return result;
}

/**
 * Render newsletter HTML for preview
 */
export async function renderNewsletterForPreview(newsletter) {
  // Mock subscriber info for preview
  const mockSubscriber = {
    id: 999,
    email: 'preview@example.com',
    unsubscribeToken: generateUnsubscribeToken(999, 'preview@example.com')
  };

  return renderNewsletterHTML({
    title: newsletter.title,
    month: newsletter.month,
    heroImageUrl: newsletter.heroImageUrl,
    introContent: newsletter.introContent,
    sections: newsletter.sections || [],
    signoffContent: newsletter.signoffContent
  }, mockSubscriber);
}
