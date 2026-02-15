import express from 'express';
import { query } from '../db.js';

const router = express.Router();

const mapNewsletter = (row) => ({
  id: row.id,
  projectName: row.project_name,
  title: row.title,
  month: row.month,
  heroImageUrl: row.hero_image_url,
  // Keep old fields for backwards compatibility
  introHtml: row.intro_html,
  introMarkdown: row.intro_markdown,
  snippets: row.snippets || [],
  // New section-based fields
  introPrompt: row.intro_prompt,
  introContent: row.intro_content,
  sections: row.sections || [],
  signoffPrompt: row.signoff_prompt,
  signoffContent: row.signoff_content,
  status: row.status,
  // Return ISO string so frontend can convert to local timezone
  scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : '',
  sentAt: row.sent_at
});

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM newsletters ORDER BY created_at DESC');
    res.json(rows.map(mapNewsletter));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM newsletters WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(mapNewsletter(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      projectName, title, month, heroImageUrl,
      introPrompt, introContent,
      sections,
      signoffPrompt, signoffContent
    } = req.body;

    const { rows } = await query(
      `INSERT INTO newsletters (
        project_name, title, month, hero_image_url,
        intro_prompt, intro_content,
        sections,
        signoff_prompt, signoff_content
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        projectName || 'Untitled Project',
        title || 'Untitled',
        month,
        heroImageUrl,
        introPrompt,
        introContent,
        JSON.stringify(sections || []),
        signoffPrompt,
        signoffContent
      ]
    );
    res.json(mapNewsletter(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const {
      projectName, title, month, heroImageUrl,
      introPrompt, introContent,
      sections,
      signoffPrompt, signoffContent,
      status, scheduledAt
    } = req.body;

    const { rows } = await query(
      `UPDATE newsletters
       SET project_name = $1,
           title = $2,
           month = $3,
           hero_image_url = $4,
           intro_prompt = $5,
           intro_content = $6,
           sections = $7,
           signoff_prompt = $8,
           signoff_content = $9,
           status = $10,
           scheduled_at = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        projectName,
        title,
        month,
        heroImageUrl,
        introPrompt,
        introContent,
        JSON.stringify(sections || []),
        signoffPrompt,
        signoffContent,
        status || 'draft',
        scheduledAt || null,
        req.params.id
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(mapNewsletter(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE newsletters
       SET status = 'approved', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(mapNewsletter(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/schedule', async (req, res, next) => {
  try {
    const { scheduledAt } = req.body;
    const { rows } = await query(
      `UPDATE newsletters
       SET status = 'scheduled', scheduled_at = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [scheduledAt, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(mapNewsletter(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/unschedule', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE newsletters
       SET status = 'approved', scheduled_at = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(mapNewsletter(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/send', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE newsletters
       SET status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(mapNewsletter(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const { rows: original } = await query('SELECT * FROM newsletters WHERE id = $1', [req.params.id]);
    if (!original[0]) return res.status(404).json({ error: 'Not found' });

    const orig = original[0];

    // Count existing copies to make unique names
    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM newsletters WHERE project_name LIKE $1`,
      [`${orig.project_name || orig.title} (Copy%`]
    );
    const copyCount = parseInt(countRows[0].count);
    const copyName = copyCount > 0
      ? `${orig.project_name || orig.title} (Copy ${copyCount + 1})`
      : `${orig.project_name || orig.title} (Copy)`;

    const { rows } = await query(
      `INSERT INTO newsletters (
        project_name, title, month, hero_image_url,
        intro_prompt, intro_content,
        sections,
        signoff_prompt, signoff_content,
        status
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        copyName,
        orig.title,
        orig.month,
        orig.hero_image_url,
        orig.intro_prompt,
        orig.intro_content,
        JSON.stringify(orig.sections || []),
        orig.signoff_prompt,
        orig.signoff_content,
        'draft'
      ]
    );
    res.json(mapNewsletter(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      'DELETE FROM newsletters WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

export default router;
