import express from 'express';
import { generateIntro, generateBlurb, generateSignoff, cleanTitle } from '../services/openai.js';
import { fetchArticleContent, imageUrlToBase64 } from '../services/scraper.js';
import { scrapeDevToolJobs } from '../services/jobScraper.js';

const router = express.Router();

const NO_BLURB_SECTIONS = [
  'Technology was a mistake',
  'Technical & Developer Marketing Jobs',
  'Folks to follow'
];

/**
 * POST /api/ai/generate-intro
 * Body: { prompt: string }
 */
router.post('/generate-intro', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const content = await generateIntro(prompt);
    res.json({ content });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/generate-blurb
 * Body: { url: string, sectionName: string }
 */
router.post('/generate-blurb', async (req, res, next) => {
  try {
    const { url, sectionName } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    if (!sectionName) {
      return res.status(400).json({ error: 'Section name is required' });
    }

    // Fetch article content
    const article = await fetchArticleContent(url);

    // Clean the title (remove author names, extract job/person name)
    const cleanedTitle = await cleanTitle(article.title, article.content, sectionName);

    // For jobs and folks to follow, don't generate a blurb
    const needsBlurb = !NO_BLURB_SECTIONS.includes(sectionName);
    let blurb = '';

    if (needsBlurb) {
      // Generate blurb using AI
      blurb = await generateBlurb(url, article.content, sectionName);
    }

    // Convert image URL to base64 for reliable email delivery
    let imageUrlBase64 = '';
    if (article.imageUrl) {
      imageUrlBase64 = await imageUrlToBase64(article.imageUrl);
    }

    res.json({
      url,
      title: cleanedTitle,
      blurb,
      imageUrl: imageUrlBase64,
      needsBlurb
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/generate-signoff
 * Body: { prompt: string }
 */
router.post('/generate-signoff', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const content = await generateSignoff(prompt);
    res.json({ content });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/scrape-jobs
 * Scrapes DevToolJobs for Developer Marketing jobs
 */
router.get('/scrape-jobs', async (req, res, next) => {
  try {
    const jobs = await scrapeDevToolJobs();
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
});

export default router;
