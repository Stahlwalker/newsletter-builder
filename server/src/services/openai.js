import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Load the writing style guide (from project root, not server folder)
const styleGuidePath = path.join(__dirname, '../../../docs/Writing-Style.md');
const STYLE_GUIDE = fs.readFileSync(styleGuidePath, 'utf-8');

/**
 * Generate intro content from user prompt
 */
async function generateIntro(prompt) {
  const systemPrompt = `You are a newsletter writer following the Writing Style Guide.

${STYLE_GUIDE}

Your task is to write a newsletter intro based on the user's prompt. The intro should be 2-3 sentences max, casual but purposeful, and set the tone for the newsletter.

CRITICAL: Avoid ALL AI writing patterns. Specifically:
- NO "Let's explore", "In this newsletter", "dive into" openings
- NO empty superlatives like "game-changing", "cutting-edge", "exciting"
- NO insight theater - every sentence must add concrete value
- NO "real-world" or borrowed credibility phrases
- Sound like a developer in a Slack conversation, not a polished marketing piece
- Write from firsthand experience or accountability

Follow the style guide strictly and use the AI Writing Checklist before responding.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Write a newsletter intro based on this prompt: ${prompt}` }
    ],
    temperature: 0.7,
    max_tokens: 300
  });

  return response.choices[0].message.content.trim();
}

/**
 * Generate blurb from article content and URL
 */
async function generateBlurb(url, articleContent, sectionName) {
  const systemPrompt = `You are a newsletter writer following the Writing Style Guide.

${STYLE_GUIDE}

Your task is to write a 1-2 sentence blurb about an article for the "${sectionName}" section of a newsletter. The blurb should be:
- Concise and matter-of-fact
- Highlight what's useful or interesting about the content
- No hype or promotional language
- Include the key takeaway or insight
- Do NOT include the author's name

CRITICAL: Avoid ALL AI writing patterns. Specifically:
- NO vague adverbs (seamlessly, robustly, effortlessly)
- NO empty conclusions that reframe obvious facts
- NO "highlighting", "ensuring", "reflecting" padding
- NO promotional tone or superlatives
- State what the article shows or explains, not what it "explores"
- Use specific technical details, constraints, or outcomes
- Sound like you're recommending it to a colleague, not selling it

Follow the style guide strictly. Do NOT include the URL or article title in your response - just write the blurb.`;

  const userPrompt = `Write a 1-2 sentence blurb for this article:

URL: ${url}

Article Content:
${articleContent.slice(0, 4000)}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 200
  });

  return response.choices[0].message.content.trim();
}

/**
 * Clean title to remove author names and common patterns
 */
async function cleanTitle(rawTitle, articleContent, sectionName) {
  // For jobs and folks to follow, use AI to extract the clean title
  if (sectionName === 'Technical & Developer Marketing Jobs') {
    const systemPrompt = `Extract just the job title and company name from this job posting.
Format: "Job Title at Company Name"
Do not include location, salary, author names, or any other information.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Raw title: ${rawTitle}\n\nContent preview:\n${articleContent.slice(0, 500)}` }
      ],
      temperature: 0.3,
      max_tokens: 100
    });

    return response.choices[0].message.content.trim();
  }

  if (sectionName === 'Folks to follow') {
    const systemPrompt = `Extract just the person's name from this profile or article.
Return ONLY the person's name, nothing else. No titles, no descriptions.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Raw title: ${rawTitle}\n\nContent preview:\n${articleContent.slice(0, 500)}` }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    return response.choices[0].message.content.trim();
  }

  // For blog posts and links, remove author names
  const systemPrompt = `Clean this article title by removing author names, publication names, and date suffixes.
Keep the core topic/title only. Do not add any new words.
Examples:
- "Building Better APIs by John Smith - Dev.to" -> "Building Better APIs"
- "How We Scaled to 1M Users | Jane Doe" -> "How We Scaled to 1M Users"`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: rawTitle }
    ],
    temperature: 0.3,
    max_tokens: 100
  });

  return response.choices[0].message.content.trim();
}

/**
 * Generate signoff content from user prompt
 */
async function generateSignoff(prompt) {
  const systemPrompt = `You are a newsletter writer following the Writing Style Guide.

${STYLE_GUIDE}

Your task is to write a newsletter signoff based on the user's prompt. The signoff should be:
- 1-2 sentences max
- Casual and genuine
- Not cheesy or overly friendly
- Can include a call to action or just a simple goodbye

CRITICAL: Avoid ALL AI writing patterns. Specifically:
- NO "In conclusion", "Looking ahead", "This represents an exciting future"
- NO padded conclusions that add nothing
- NO overly balanced or polished phrases
- End with something concrete: a next step, limitation, or simple goodbye
- Sound like how you'd actually sign off a casual email to developers

Follow the style guide strictly.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Write a newsletter signoff based on this prompt: ${prompt}` }
    ],
    temperature: 0.7,
    max_tokens: 200
  });

  return response.choices[0].message.content.trim();
}

export {
  generateIntro,
  generateBlurb,
  generateSignoff,
  cleanTitle
};
