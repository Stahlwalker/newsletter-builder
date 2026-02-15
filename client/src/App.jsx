import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5050/api';

const SECTION_NAMES = [
  'Blogs & Projects',
  'Links I like',
  'Technology was a mistake',
  'Technical & Developer Marketing Jobs',
  'Folks to follow'
];

const NO_BLURB_SECTIONS = [
  'Technology was a mistake',
  'Technical & Developer Marketing Jobs',
  'Folks to follow'
];

const AUTHOR_ONLY_SECTIONS = [
  'Technology was a mistake'
];

const emptyNewsletter = () => ({
  id: null,
  projectName: '',
  title: '',
  month: '',
  heroImageUrl: '',
  introPrompt: '',
  introContent: '',
  sections: SECTION_NAMES.map(name => ({ name, items: [] })),
  signoffPrompt: '',
  signoffContent: '',
  status: 'draft',
  scheduledAt: ''
});

const formatStatus = (status) => status?.toUpperCase() || 'DRAFT';

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Request failed');
  }
  // Handle 204 No Content responses (like DELETE)
  if (res.status === 204) {
    return null;
  }
  return res.json();
};

function Preview({ newsletter, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '32px',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>

        <h1 style={{ marginBottom: '8px' }}>{newsletter.title}</h1>
        <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '24px' }}>{newsletter.month}</p>

        {newsletter.heroImageUrl && (
          <div style={{ marginBottom: '24px' }}>
            <img
              src={newsletter.heroImageUrl}
              alt="Newsletter hero"
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
          </div>
        )}

        {newsletter.introContent && (
          <div style={{ marginBottom: '32px' }}>
            <p>{newsletter.introContent}</p>
          </div>
        )}

        {newsletter.sections.map((section, idx) => {
          if (section.items.length === 0) return null;
          const needsBlurb = !NO_BLURB_SECTIONS.includes(section.name);
          const showAuthor = needsBlurb || AUTHOR_ONLY_SECTIONS.includes(section.name);

          return (
            <div key={idx} style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5em', marginBottom: '16px' }}>{section.name}</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx} style={{
                    marginBottom: '20px',
                    display: item.imageUrl && section.name === 'Blogs & Projects' ? 'flex' : 'block',
                    gap: item.imageUrl && section.name === 'Blogs & Projects' ? '16px' : '0',
                    alignItems: item.imageUrl && section.name === 'Blogs & Projects' ? 'center' : 'normal'
                  }}>
                    {item.imageUrl && section.name === 'Blogs & Projects' && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{
                          width: '160px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          flexShrink: 0
                        }}
                      />
                    )}
                    <div style={{ flex: item.imageUrl && section.name === 'Blogs & Projects' ? 1 : 'auto' }}>
                      <strong>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>
                          {item.title}
                        </a>
                      </strong>
                      {needsBlurb && item.blurb && (
                        <span> - {item.blurb}</span>
                      )}
                      {showAuthor && item.author && (
                        <div style={{ fontSize: '0.875rem', color: '#888', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.05em' }}>
                          {item.author}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {section.name === 'Links I like' && (
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <a
                    href="https://yourdomain.com/archive/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    More Content →
                  </a>
                </div>
              )}
            </div>
          );
        })}

        {newsletter.signoffContent && (
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #ddd' }}>
            <p>{newsletter.signoffContent}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [newsletters, setNewsletters] = useState([]);
  const [current, setCurrent] = useState(emptyNewsletter());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [view, setView] = useState('editor'); // 'editor' or 'subscribers'
  const [subscribers, setSubscribers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const statusLabel = formatStatus(current.status);

  const loadNewsletters = async () => {
    const data = await fetchJson(`${API_BASE}/newsletters`);
    // Convert ISO timestamps to local datetime-local format
    const newsletters = data.map(nl => ({
      ...nl,
      scheduledAt: nl.scheduledAt ? convertToLocalDatetimeString(nl.scheduledAt) : ''
    }));
    setNewsletters(newsletters);
    if (!current.id && newsletters.length) {
      const newsletter = newsletters[0];
      if (!newsletter.sections || newsletter.sections.length === 0) {
        newsletter.sections = SECTION_NAMES.map(name => ({ name, items: [] }));
      }
      setCurrent(newsletter);
    }
  };

  // Helper to convert ISO string to local datetime-local format
  const convertToLocalDatetimeString = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Format: YYYY-MM-DDTHH:MM
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const loadSubscribers = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/subscribers`);
      setSubscribers(data);
    } catch (err) {
      setError(`Failed to load subscribers: ${err.message}`);
    }
  };

  const deleteSubscriber = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this subscriber?');
    if (!confirmed) return;

    setLoading(true);
    setError('');
    try {
      await fetchJson(`${API_BASE}/subscribers/${id}`, {
        method: 'DELETE'
      });
      await loadSubscribers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriber = async () => {
    if (!editingSubscriber.email || !editingSubscriber.name) {
      setError('Email and name are required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await fetchJson(`${API_BASE}/subscribers/${editingSubscriber.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          email: editingSubscriber.email,
          name: editingSubscriber.name
        })
      });
      await loadSubscribers();
      setShowEditModal(false);
      setEditingSubscriber(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (newsletterId) => {
    if (!newsletterId) return;
    setLoadingAnalytics(true);
    try {
      const data = await fetchJson(`${API_BASE}/analytics/newsletter/${newsletterId}`);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadNewsletters().catch((err) => {
      setError(`${err.message}. Server may be offline.`);
    });
  }, []);

  useEffect(() => {
    // Load analytics when viewing a sent newsletter
    if (current.id && current.status === 'sent') {
      loadAnalytics(current.id);
    } else {
      setAnalytics(null);
    }
  }, [current.id, current.status]);

  const generateIntro = async () => {
    if (!current.introPrompt) {
      setError('Please enter an intro prompt first.');
      return;
    }
    setGenerating(prev => ({ ...prev, intro: true }));
    setError('');
    try {
      const result = await fetchJson(`${API_BASE}/ai/generate-intro`, {
        method: 'POST',
        body: JSON.stringify({ prompt: current.introPrompt })
      });
      setCurrent(prev => ({ ...prev, introContent: result.content }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(prev => ({ ...prev, intro: false }));
    }
  };

  const generateBlurb = async (sectionIndex, itemUrl) => {
    if (!itemUrl) {
      setError('Please enter a URL first.');
      return;
    }
    const sectionName = current.sections[sectionIndex].name;
    const key = `section-${sectionIndex}-${itemUrl}`;
    setGenerating(prev => ({ ...prev, [key]: true }));
    setError('');
    try {
      const result = await fetchJson(`${API_BASE}/ai/generate-blurb`, {
        method: 'POST',
        body: JSON.stringify({ url: itemUrl, sectionName })
      });

      setCurrent(prev => {
        const newSections = [...prev.sections];
        const existingItemIndex = newSections[sectionIndex].items.findIndex(item => item.url === itemUrl);

        const newItem = {
          url: result.url,
          title: result.title,
          blurb: result.blurb || '',
          author: result.author || '',
          imageUrl: result.imageUrl || '',
          needsBlurb: result.needsBlurb
        };

        if (existingItemIndex >= 0) {
          newSections[sectionIndex].items[existingItemIndex] = newItem;
        } else {
          newSections[sectionIndex].items.push(newItem);
        }

        return { ...prev, sections: newSections };
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(prev => ({ ...prev, [key]: false }));
    }
  };

  const generateSignoff = async () => {
    if (!current.signoffPrompt) {
      setError('Please enter a signoff prompt first.');
      return;
    }
    setGenerating(prev => ({ ...prev, signoff: true }));
    setError('');
    try {
      const result = await fetchJson(`${API_BASE}/ai/generate-signoff`, {
        method: 'POST',
        body: JSON.stringify({ prompt: current.signoffPrompt })
      });
      setCurrent(prev => ({ ...prev, signoffContent: result.content }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(prev => ({ ...prev, signoff: false }));
    }
  };

  const pullJobsFromDevToolJobs = async () => {
    setGenerating(prev => ({ ...prev, jobs: true }));
    setError('');
    try {
      const result = await fetchJson(`${API_BASE}/ai/scrape-jobs`);

      // Find the jobs section (index 2 since it's "Technical & Developer Marketing Jobs")
      const jobsSectionIndex = current.sections.findIndex(
        s => s.name === 'Technical & Developer Marketing Jobs'
      );

      if (jobsSectionIndex !== -1 && result.jobs && result.jobs.length > 0) {
        setCurrent(prev => {
          const newSections = [...prev.sections];
          // Add jobs to the section (append to existing)
          const newJobs = result.jobs.map(job => ({
            url: job.url,
            title: `${job.title} at ${job.company}`,
            blurb: '',
            needsBlurb: false
          }));
          newSections[jobsSectionIndex].items = [
            ...newSections[jobsSectionIndex].items,
            ...newJobs
          ];
          return { ...prev, sections: newSections };
        });
      } else if (result.jobs && result.jobs.length === 0) {
        setError('No developer marketing jobs found on DevToolJobs.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(prev => ({ ...prev, jobs: false }));
    }
  };

  const removeItem = (sectionIndex, itemIndex) => {
    setCurrent(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].items.splice(itemIndex, 1);
      return { ...prev, sections: newSections };
    });
  };

  const saveNewsletter = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = { ...current };
      let saved;
      if (current.id) {
        saved = await fetchJson(`${API_BASE}/newsletters/${current.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        saved = await fetchJson(`${API_BASE}/newsletters`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      // Convert scheduledAt to local format
      saved.scheduledAt = saved.scheduledAt ? convertToLocalDatetimeString(saved.scheduledAt) : '';
      setCurrent(saved);
      await loadNewsletters();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approveNewsletter = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await fetchJson(`${API_BASE}/newsletters/${current.id}/approve`, {
        method: 'POST'
      });
      updated.scheduledAt = updated.scheduledAt ? convertToLocalDatetimeString(updated.scheduledAt) : '';
      setCurrent(updated);
      await loadNewsletters();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scheduleNewsletter = async () => {
    if (!current.scheduledAt) {
      setError('Pick a scheduled date/time.');
      return;
    }

    // Convert local datetime to ISO string with timezone for storage
    const localDate = new Date(current.scheduledAt);
    const isoString = localDate.toISOString();

    // Check if the scheduled time is in the past
    if (localDate <= new Date()) {
      setError('Scheduled time must be in the future.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updated = await fetchJson(`${API_BASE}/newsletters/${current.id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduledAt: isoString })
      });
      // Convert back to local for display
      updated.scheduledAt = updated.scheduledAt ? convertToLocalDatetimeString(updated.scheduledAt) : '';
      setCurrent(updated);
      await loadNewsletters();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const unscheduleNewsletter = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await fetchJson(`${API_BASE}/newsletters/${current.id}/unschedule`, {
        method: 'POST'
      });
      updated.scheduledAt = updated.scheduledAt ? convertToLocalDatetimeString(updated.scheduledAt) : '';
      setCurrent(updated);
      await loadNewsletters();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHeroImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrent(prev => ({ ...prev, heroImageUrl: reader.result }));
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const exportMarkdown = () => {
    const lines = [
      `# ${current.title}`,
      `_${current.month}_`,
      '',
      '## Intro',
      current.introContent || '',
      ''
    ];

    current.sections.forEach(section => {
      if (section.items.length > 0) {
        lines.push(`## ${section.name}`, '');
        const needsBlurb = !NO_BLURB_SECTIONS.includes(section.name);
        const showAuthor = needsBlurb || AUTHOR_ONLY_SECTIONS.includes(section.name);
        section.items.forEach(item => {
          if (needsBlurb && item.blurb) {
            lines.push(`- **${item.title}**: ${item.blurb} [Read more](${item.url})`);
            if (item.author) {
              lines.push(`  _${item.author}_`);
            }
          } else {
            lines.push(`- [${item.title}](${item.url})`);
            if (showAuthor && item.author) {
              lines.push(`  _${item.author}_`);
            }
          }
        });
        lines.push('');
      }
    });

    lines.push('## Signoff', current.signoffContent || '');

    const markdown = lines.join('\n');
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${current.title || 'newsletter'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewEmail = () => {
    if (!current.id) {
      setError('Please save the newsletter first before previewing the email.');
      return;
    }
    // Open email preview in new window
    window.open(`${API_BASE}/email/preview/${current.id}`, '_blank');
  };

  const sendTestEmail = async () => {
    if (!current.id) {
      setError('Please save the newsletter first before sending a test.');
      return;
    }

    const testEmail = prompt('Enter email address to send test to:');
    if (!testEmail) return;

    setLoading(true);
    setError('');
    try {
      await fetchJson(`${API_BASE}/email/test/${current.id}`, {
        method: 'POST',
        body: JSON.stringify({ email: testEmail })
      });
      alert(`Test email sent to ${testEmail}!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendNewsletter = async () => {
    if (!current.id) {
      setError('Please save the newsletter first before sending.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to send this newsletter to all verified subscribers? This cannot be undone.'
    );

    if (!confirmed) return;

    setLoading(true);
    setError('');
    try {
      const result = await fetchJson(`${API_BASE}/email/send/${current.id}`, {
        method: 'POST'
      });
      alert(result.message);
      await loadNewsletters();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const duplicateNewsletter = async (id, e) => {
    e.stopPropagation();
    setLoading(true);
    setError('');
    try {
      const duplicated = await fetchJson(`${API_BASE}/newsletters/${id}/duplicate`, {
        method: 'POST'
      });
      duplicated.scheduledAt = duplicated.scheduledAt ? convertToLocalDatetimeString(duplicated.scheduledAt) : '';
      await loadNewsletters();
      setCurrent(duplicated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteNewsletter = async (id, e) => {
    e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to delete this newsletter?');
    if (!confirmed) return;

    setLoading(true);
    setError('');
    try {
      await fetchJson(`${API_BASE}/newsletters/${id}`, {
        method: 'DELETE'
      });
      await loadNewsletters();
      if (current.id === id) {
        setCurrent(emptyNewsletter());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const EditSubscriberModal = () => (
    <div className="newsletter-modal-overlay" onClick={() => setShowEditModal(false)}>
      <div className="newsletter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="newsletter-modal-header">
          <h3>Edit Subscriber</h3>
          <button onClick={() => setShowEditModal(false)} className="modal-close-btn">✕</button>
        </div>
        <div className="field">
          <label>Name</label>
          <input
            value={editingSubscriber?.name || ''}
            onChange={(e) => setEditingSubscriber(prev => ({ ...prev, name: e.target.value }))}
            placeholder="John Doe"
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={editingSubscriber?.email || ''}
            onChange={(e) => setEditingSubscriber(prev => ({ ...prev, email: e.target.value }))}
            placeholder="john@example.com"
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={updateSubscriber}
            disabled={loading}
            style={{ flex: 1, background: 'var(--color-primary)', color: 'var(--color-bg-primary)', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => setShowEditModal(false)}
            style={{ flex: 1, background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const NewsletterListModal = () => (
    <div className="newsletter-modal-overlay" onClick={() => setShowNewsletterModal(false)}>
      <div className="newsletter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="newsletter-modal-header">
          <h3>Select Newsletter</h3>
          <button onClick={() => setShowNewsletterModal(false)} className="modal-close-btn">✕</button>
        </div>
        <button
          onClick={() => {
            setCurrent(emptyNewsletter());
            setShowNewsletterModal(false);
          }}
          style={{ width: '100%', marginBottom: 'var(--space-2)' }}
        >
          New Newsletter
        </button>
        <ul className="newsletter-modal-list">
          {newsletters.map((nl) => (
            <li
              key={nl.id}
              className={nl.id === current.id ? 'active' : ''}
              onClick={() => {
                if (!nl.sections || nl.sections.length === 0) {
                  nl.sections = SECTION_NAMES.map(name => ({ name, items: [] }));
                }
                setCurrent(nl);
                setShowNewsletterModal(false);
              }}
            >
              <span className="newsletter-title">{nl.projectName || nl.title || 'Untitled'}</span>
              <div className="newsletter-actions">
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateNewsletter(nl.id, e);
                    setShowNewsletterModal(false);
                  }}
                  title="Duplicate"
                  aria-label="Duplicate newsletter"
                >
                  <i className="fa-solid fa-copy"></i>
                </button>
                <button
                  className="icon-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNewsletter(nl.id, e);
                  }}
                  title="Delete"
                  aria-label="Delete newsletter"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="app">
      {showPreview && <Preview newsletter={current} onClose={() => setShowPreview(false)} />}
      {showNewsletterModal && <NewsletterListModal />}
      {showEditModal && <EditSubscriberModal />}

      <aside className="sidebar">
        <h1>The Newsletter Builder</h1>
        <div className="toggle-buttons">
          <button
            onClick={() => setView('editor')}
            style={{ background: view === 'editor' ? 'var(--color-primary)' : 'transparent', border: '1px solid var(--color-primary)', color: view === 'editor' ? 'var(--color-bg-primary)' : 'var(--color-primary)' }}
          >
            Newsletters
          </button>
          <button
            onClick={() => { setView('subscribers'); loadSubscribers(); }}
            style={{ background: view === 'subscribers' ? 'var(--color-primary)' : 'transparent', border: '1px solid var(--color-primary)', color: view === 'subscribers' ? 'var(--color-bg-primary)' : 'var(--color-primary)' }}
          >
            Subscribers
          </button>
        </div>
        {view === 'editor' && (
          <>
            <button className="mobile-newsletter-selector" onClick={() => setShowNewsletterModal(true)}>
              📄 Editions
            </button>
            <button className="desktop-only-btn" onClick={() => setCurrent(emptyNewsletter())}>New Newsletter</button>
            <ul className="desktop-only-list">
              {newsletters.map((nl) => (
                <li
                  key={nl.id}
                  className={nl.id === current.id ? 'active' : ''}
                  onClick={() => {
                    if (!nl.sections || nl.sections.length === 0) {
                      nl.sections = SECTION_NAMES.map(name => ({ name, items: [] }));
                    }
                    setCurrent(nl);
                  }}
                >
                  <span className="newsletter-title">{nl.projectName || nl.title || 'Untitled'}</span>
                  <div className="newsletter-actions">
                    <button
                      className="icon-btn"
                      onClick={(e) => duplicateNewsletter(nl.id, e)}
                      title="Duplicate"
                      aria-label="Duplicate newsletter"
                    >
                      <i className="fa-solid fa-copy"></i>
                    </button>
                    <button
                      className="icon-btn delete-btn"
                      onClick={(e) => deleteNewsletter(nl.id, e)}
                      title="Delete"
                      aria-label="Delete newsletter"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>

      <main className="main">
        {view === 'subscribers' ? (
          <>
            <div className="header">
              <div>
                <h2>Subscribers</h2>
                <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0 0', fontSize: '0.9rem' }}>
                  {subscribers.length} total ({subscribers.filter(s => s.verified_at).length} verified)
                </p>
              </div>
            </div>

            {error && (
              <div className="card" style={{ border: '1px solid #ff8a80', background: '#ffebee', padding: '12px' }}>
                {error}
              </div>
            )}

            <div className="card">
              {subscribers.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)' }}>No subscribers yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Name</th>
                        <th style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Email</th>
                        <th style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Status</th>
                        <th style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Joined</th>
                        <th style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--color-text-primary)', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px 8px' }}>{sub.name || '-'}</td>
                          <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{sub.email}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: sub.verified_at ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                              color: sub.verified_at ? 'var(--color-success)' : 'var(--color-warning)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              {sub.verified_at ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            {new Date(sub.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                className="icon-btn"
                                onClick={() => {
                                  setEditingSubscriber(sub);
                                  setShowEditModal(true);
                                }}
                                title="Edit subscriber"
                                aria-label="Edit subscriber"
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                              <button
                                className="icon-btn delete-btn"
                                onClick={() => deleteSubscriber(sub.id)}
                                title="Delete subscriber"
                                aria-label="Delete subscriber"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="header">
              <div>
                <h2>Newsletter Builder</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className={`status-pill status-${current.status || 'draft'}`}>{statusLabel}</div>
                </div>
              </div>
              <div className="actions">
                <button className="secondary" onClick={exportMarkdown} disabled={!current.title}>
                  Export Markdown
                </button>
                <button className="primary" onClick={saveNewsletter} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
            </div>

            {error && (
              <div className="card" style={{ border: '1px solid #ff8a80', background: '#ffebee', padding: '12px' }}>
                {error}
              </div>
            )}

        <div className="card">
          <div className="field">
            <label>Project Name</label>
            <input
              value={current.projectName}
              onChange={(e) => setCurrent(prev => ({ ...prev, projectName: e.target.value }))}
              placeholder="My Newsletter Project"
            />
          </div>
          <div className="field">
            <label>Newsletter Title</label>
            <input
              value={current.title}
              onChange={(e) => setCurrent(prev => ({ ...prev, title: e.target.value }))}
              placeholder="February Highlights"
            />
          </div>
          <div className="field">
            <label>Month</label>
            <input
              value={current.month}
              onChange={(e) => setCurrent(prev => ({ ...prev, month: e.target.value }))}
              placeholder="February 2026"
            />
          </div>
          <div className="field">
            <label>Hero Image (optional)</label>
            {current.heroImageUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <img
                  src={current.heroImageUrl}
                  alt="Hero preview"
                  style={{
                    width: '320px',
                    height: '160px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                  }}
                />
                <button
                  className="secondary"
                  onClick={() => setCurrent(prev => ({ ...prev, heroImageUrl: '' }))}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroImageUpload}
                style={{ padding: '0.5rem' }}
              />
            )}
          </div>
        </div>

        {/* 1. INTRO SECTION */}
        <div className="card">
          <h3>1. Intro</h3>
          <div className="field">
            <label>Intro Prompt</label>
            <textarea
              value={current.introPrompt}
              onChange={(e) => setCurrent(prev => ({ ...prev, introPrompt: e.target.value }))}
              placeholder="Give a general idea of what you want in the intro..."
              rows={2}
            />
          </div>
          <button
            className="primary"
            onClick={generateIntro}
            disabled={generating.intro || !current.introPrompt}
          >
            {generating.intro ? 'Generating...' : 'Generate Intro'}
          </button>
          {current.introContent && (
            <>
              <div className="field" style={{ marginTop: '16px' }}>
                <label>Generated Intro</label>
                <textarea
                  value={current.introContent}
                  onChange={(e) => setCurrent(prev => ({ ...prev, introContent: e.target.value }))}
                  rows={4}
                />
              </div>
              <button
                className="secondary"
                onClick={generateIntro}
                disabled={generating.intro}
                style={{ marginTop: '8px' }}
              >
                Regenerate
              </button>
            </>
          )}
        </div>

        {/* 2-5. SECTION ITEMS */}
        {current.sections.map((section, sectionIndex) => {
          const needsBlurb = !NO_BLURB_SECTIONS.includes(section.name);
          const isJobsSection = section.name === 'Technical & Developer Marketing Jobs';

          return (
            <div className="card" key={sectionIndex}>
              <h3>{sectionIndex + 2}. {section.name}</h3>

              {/* Auto-pull jobs button for jobs section */}
              {isJobsSection && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button
                      className="secondary"
                      onClick={pullJobsFromDevToolJobs}
                      disabled={generating.jobs}
                      style={{ flex: 1 }}
                    >
                      {generating.jobs ? 'Pulling Jobs...' : '🔄 Auto-Pull Jobs'}
                    </button>
                    <button
                      className="secondary"
                      onClick={() => window.open('https://devtooljobs.com/search?q=%22Developer%22&category=Marketing&page=1&pageSize=30', '_blank')}
                      style={{ flex: 1 }}
                    >
                      🔍 Job Checker
                    </button>
                  </div>
                  <p style={{ fontSize: '0.9em', color: '#666', marginTop: '8px', marginBottom: 0 }}>
                    Auto-pull scrapes jobs automatically, or use Job Checker to browse and add manually
                  </p>
                </div>
              )}

              {/* Add Item Form */}
              <div className="field">
                <label>Add Link {isJobsSection && '(or use auto-pull above)'}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id={`url-input-${sectionIndex}`}
                    placeholder="https://..."
                    style={{ flex: 1 }}
                  />
                  <button
                    className="primary"
                    onClick={() => {
                      const input = document.getElementById(`url-input-${sectionIndex}`);
                      const url = input.value.trim();
                      if (url) {
                        generateBlurb(sectionIndex, url);
                        input.value = '';
                      }
                    }}
                    disabled={generating[`section-${sectionIndex}`]}
                  >
                    {generating[`section-${sectionIndex}`] ? 'Generating...' : needsBlurb ? 'Generate Blurb' : 'Add Link'}
                  </button>
                </div>
              </div>

              {/* Display Items */}
              {section.items.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="snippet">
                      <div style={{ flex: 1 }}>
                        <div className="field">
                          <label>Title {!needsBlurb && '(Name/Job Title)'}</label>
                          <input
                            value={item.title}
                            onChange={(e) => {
                              setCurrent(prev => {
                                const newSections = [...prev.sections];
                                newSections[sectionIndex].items[itemIndex].title = e.target.value;
                                return { ...prev, sections: newSections };
                              });
                            }}
                          />
                        </div>
                        <div className="field">
                          <label>URL</label>
                          <input
                            value={item.url}
                            onChange={(e) => {
                              setCurrent(prev => {
                                const newSections = [...prev.sections];
                                newSections[sectionIndex].items[itemIndex].url = e.target.value;
                                return { ...prev, sections: newSections };
                              });
                            }}
                          />
                        </div>
                        {needsBlurb && (
                          <div className="field">
                            <label>Blurb</label>
                            <textarea
                              value={item.blurb}
                              onChange={(e) => {
                                setCurrent(prev => {
                                  const newSections = [...prev.sections];
                                  newSections[sectionIndex].items[itemIndex].blurb = e.target.value;
                                  return { ...prev, sections: newSections };
                                });
                              }}
                              rows={3}
                            />
                          </div>
                        )}
                        {section.name === 'Blogs & Projects' && (
                          <div className="field">
                            <label>Thumbnail Image (optional)</label>
                            {item.imageUrl ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                <img
                                  src={item.imageUrl}
                                  alt="Item thumbnail"
                                  style={{
                                    width: '160px',
                                    height: '80px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)'
                                  }}
                                />
                                <button
                                  className="secondary"
                                  onClick={() => {
                                    setCurrent(prev => {
                                      const newSections = [...prev.sections];
                                      newSections[sectionIndex].items[itemIndex].imageUrl = '';
                                      return { ...prev, sections: newSections };
                                    });
                                  }}
                                  style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '0.375rem 0.75rem' }}
                                >
                                  Remove Image
                                </button>
                              </div>
                            ) : (
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (!file.type.startsWith('image/')) {
                                    setError('Please upload an image file');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCurrent(prev => {
                                      const newSections = [...prev.sections];
                                      newSections[sectionIndex].items[itemIndex].imageUrl = reader.result;
                                      return { ...prev, sections: newSections };
                                    });
                                  };
                                  reader.onerror = () => setError('Failed to read image file');
                                  reader.readAsDataURL(file);
                                }}
                              />
                            )}
                          </div>
                        )}
                        {(needsBlurb || AUTHOR_ONLY_SECTIONS.includes(section.name)) && (
                          <div className="field">
                            <label>Author (optional)</label>
                            <input
                              value={item.author || ''}
                              onChange={(e) => {
                                setCurrent(prev => {
                                  const newSections = [...prev.sections];
                                  newSections[sectionIndex].items[itemIndex].author = e.target.value;
                                  return { ...prev, sections: newSections };
                                });
                              }}
                              placeholder="Author Name"
                            />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button
                            className="secondary"
                            onClick={() => generateBlurb(sectionIndex, item.url)}
                            disabled={generating[`section-${sectionIndex}-${item.url}`]}
                          >
                            {generating[`section-${sectionIndex}-${item.url}`] ? 'Regenerating...' : 'Regenerate'}
                          </button>
                          <button
                            className="secondary"
                            onClick={() => removeItem(sectionIndex, itemIndex)}
                            style={{ background: '#ff5252', color: 'white' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* 6. SIGNOFF SECTION */}
        <div className="card">
          <h3>6. Signoff</h3>
          <div className="field">
            <label>Signoff Prompt</label>
            <textarea
              value={current.signoffPrompt}
              onChange={(e) => setCurrent(prev => ({ ...prev, signoffPrompt: e.target.value }))}
              placeholder="Give a general idea of how you want to sign off..."
              rows={2}
            />
          </div>
          <button
            className="primary"
            onClick={generateSignoff}
            disabled={generating.signoff || !current.signoffPrompt}
          >
            {generating.signoff ? 'Generating...' : 'Generate Signoff'}
          </button>
          {current.signoffContent && (
            <>
              <div className="field" style={{ marginTop: '16px' }}>
                <label>Generated Signoff</label>
                <textarea
                  value={current.signoffContent}
                  onChange={(e) => setCurrent(prev => ({ ...prev, signoffContent: e.target.value }))}
                  rows={3}
                />
              </div>
              <button
                className="secondary"
                onClick={generateSignoff}
                disabled={generating.signoff}
                style={{ marginTop: '8px' }}
              >
                Regenerate
              </button>
            </>
          )}
        </div>

        {/* ANALYTICS - Only show for sent newsletters */}
        {current.status === 'sent' && (
          <div className="card">
            <h3>📊 Analytics</h3>
            {loadingAnalytics ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>Loading analytics...</p>
            ) : analytics ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--color-primary)' }}>{analytics.stats.delivered}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Delivered</div>
                  </div>
                  <div style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--color-success)' }}>{analytics.openRate}%</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Open Rate</div>
                  </div>
                  <div style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--color-accent)' }}>{analytics.clickRate}%</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Click Rate</div>
                  </div>
                  <div style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--color-primary)' }}>{analytics.stats.uniqueOpens}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Unique Opens</div>
                  </div>
                </div>

                {analytics.clickedUrls && analytics.clickedUrls.length > 0 && (
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', marginBottom: 'var(--space-2)' }}>Top Clicked Links</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '8px', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>URL</th>
                            <th style={{ padding: '8px', fontSize: '0.875rem', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>Clicks</th>
                            <th style={{ padding: '8px', fontSize: '0.875rem', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>Unique</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.clickedUrls.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '8px', fontSize: '0.8rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                                  {item.url}
                                </a>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>{item.click_count}</td>
                              <td style={{ padding: '8px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{item.unique_clicks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {analytics.stats.bounced > 0 && (
                  <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)' }}>
                    ⚠️ {analytics.stats.bounced} email(s) bounced
                  </div>
                )}

                <button
                  className="secondary"
                  onClick={() => loadAnalytics(current.id)}
                  style={{ marginTop: 'var(--space-2)' }}
                >
                  🔄 Refresh Analytics
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)' }}>
                No analytics data yet. Analytics are collected via Resend webhooks.
                {current.id && <> Check WEBHOOK_SETUP.md for setup instructions.</>}
              </p>
            )}
          </div>
        )}

        {/* EMAIL & WORKFLOW */}
        <div className="card">
          <h3>Email & Send</h3>
          <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '16px' }}>
            Preview and send your newsletter via Resend
          </p>
          <div className="actions" style={{ marginBottom: '16px' }}>
            <button
              className="secondary"
              onClick={previewEmail}
              disabled={!current.id}
              style={{ flex: 1 }}
            >
              📧 Preview Email
            </button>
            <button
              className="secondary"
              onClick={sendTestEmail}
              disabled={!current.id || loading}
              style={{ flex: 1 }}
            >
              🧪 Send Test
            </button>
          </div>
          <button
            className="primary"
            onClick={sendNewsletter}
            disabled={!current.id || loading}
            style={{ width: '100%', marginBottom: '24px' }}
          >
            {loading ? 'Sending...' : '📮 Send to All Subscribers'}
          </button>

          <h3 style={{ marginTop: '24px' }}>Workflow</h3>
          <div className="actions">
            <button className="secondary" onClick={approveNewsletter} disabled={!current.id}>
              Approve Newsletter
            </button>
            <input
              type="datetime-local"
              value={current.scheduledAt || ''}
              onChange={(e) => setCurrent(prev => ({ ...prev, scheduledAt: e.target.value }))}
              disabled={current.status === 'scheduled'}
            />
            {current.status === 'scheduled' ? (
              <button className="secondary" onClick={unscheduleNewsletter} disabled={loading}>
                Unschedule
              </button>
            ) : (
              <button className="primary" onClick={scheduleNewsletter} disabled={!current.id}>
                Schedule Send
              </button>
            )}
          </div>
        </div>
          </>
        )}
      </main>
    </div>
  );
}
