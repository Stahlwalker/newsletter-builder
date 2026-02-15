# Writing Style Guide

This file is used by the AI content generation features to maintain consistent tone and style across your newsletter content.

## How It's Used

When you use the "Generate with AI" features in the newsletter builder (for intros, snippets, or signoffs), the OpenAI integration reads this file and uses it as a style guide. This ensures AI-generated content matches your voice.

## How to Customize

1. Add your writing style guidelines here (tone, voice, examples)
2. Include do's and don'ts
3. Add example phrases that sound like you
4. Specify any words or patterns to avoid

The AI will reference this file (via `server/src/services/openai.js`) when generating content.

## Example Style Guide

```
Voice: Conversational, technical but approachable
Tone: Helpful, honest, no hype
Avoid: Marketing jargon, empty superlatives, "game-changing", "cutting-edge"
Write like: A developer sharing useful links with colleagues
```

Leave this file empty if you want to use generic AI-generated content without style constraints.
