import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Server-side Gemini API client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// API Route: Generate Video Content from Voice Prompt
app.post('/api/generate-content', async (req, res) => {
  try {
    const { voicePrompt, format = 'shorts', persona = 'energetic', channelContext = '' } = req.body;

    if (!voicePrompt || typeof voicePrompt !== 'string' || !voicePrompt.trim()) {
      return res.status(400).json({ error: 'Voice prompt is required' });
    }

    const cleanedPrompt = voicePrompt.trim();

    // If Gemini API is available, try gemini-3.8-flash with a fast timeout
    if (ai) {
      try {
        const systemInstruction = `You are an elite YouTube creator and video producer specializing in high-retention content (${format === 'shorts' ? 'YouTube Shorts 9:16' : 'YouTube Standard 16:9'}).
When given a voice prompt or topic, create a complete, ready-to-produce video package.
Return strictly valid JSON with this structure:
{
  "topic": "Clean topic title",
  "hook": "Grabbing first 3 seconds hook to stop the scroll",
  "title": "High CTR, SEO-optimized YouTube title (under 70 chars)",
  "description": "Engaging YouTube description with keywords, summary, and call to action",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "Science & Technology",
  "estimatedDurationSec": 35,
  "scenes": [
    {
      "sceneNumber": 1,
      "header": "Short punchy scene title",
      "narrationText": "Voiceover sentence that will be spoken aloud (15-25 words)",
      "keyVisualPoints": ["Bullet 1", "Bullet 2"],
      "themeColor": "#6366f1",
      "icon": "zap",
      "durationSec": 7
    }
  ],
  "thumbnailIdea": {
    "headline": "3-4 word explosive title",
    "subtitle": "Curiosity element",
    "badge": "MUST WATCH",
    "accentColor": "#ef4444"
  }
}
Create between 4 and 6 crisp scenes. Narration must sound natural, captivating, and well-paced for voiceover speech.`;

        const promptText = `Voice Input: "${cleanedPrompt}".
Format: ${format === 'shorts' ? 'YouTube Short (under 60s)' : 'Standard Video'}.
Creator Persona: ${persona}.
${channelContext ? `Channel Context: ${channelContext}` : ''}
Generate the full YouTube production package in JSON.`;

        // 3.5s timeout race
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 3500)
        );

        const apiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        const text = response.text || '';
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed, source: 'gemini' });
      } catch (e: any) {
        console.warn('Gemini call skipped/timed out, using instant intelligent generator:', e?.message || e);
      }
    }

    // High quality deterministic fallback generator when API key is missing or offline
    const fallbackData = generateFallbackContent(cleanedPrompt, format);
    return res.json({ success: true, data: fallbackData, source: 'fallback' });
  } catch (err: any) {
    console.error('Error in /api/generate-content:', err);
    // Provide graceful fallback
    const fallbackData = generateFallbackContent(req.body?.voicePrompt || 'YouTube Growth', req.body?.format || 'shorts');
    return res.json({ success: true, data: fallbackData, source: 'fallback-error-handled' });
  }
});

function generateFallbackContent(topic: string, format: string) {
  const safeTopic = topic.length > 3 ? topic : 'Future Technology & AI Breakthroughs';
  const isShorts = format === 'shorts';

  return {
    topic: safeTopic,
    hook: `Stop scrolling! Here is what nobody tells you about ${safeTopic}.`,
    title: `${safeTopic}: The Ultimate Game Changer You Need to Know!`,
    description: `In this video we break down everything you need to know about ${safeTopic}. Learn the insider strategies and why this changes everything.\n\n🔔 Subscribe to our channel for daily automated insights!\n#${safeTopic.replace(/\s+/g, '')} #Trending #YouTubeAutomation`,
    tags: [safeTopic.toLowerCase(), 'technology', 'guide', 'viral', 'automation', '2026'],
    category: 'Science & Technology',
    estimatedDurationSec: isShorts ? 32 : 55,
    scenes: [
      {
        sceneNumber: 1,
        header: 'The Core Discovery',
        narrationText: `Here is the truth about ${safeTopic} that most creators and experts completely overlook.`,
        keyVisualPoints: ['The Hidden Advantage', 'Why timing is everything in 2026'],
        themeColor: '#4f46e5',
        icon: 'sparkles',
        durationSec: 6,
      },
      {
        sceneNumber: 2,
        header: 'How It Actually Works',
        narrationText: `When you break down the mechanics, three distinct patterns emerge that deliver massive results.`,
        keyVisualPoints: ['Automated execution loops', 'Zero friction workflows', 'Instant feedback loops'],
        themeColor: '#0ea5e9',
        icon: 'cpu',
        durationSec: 8,
      },
      {
        sceneNumber: 3,
        header: 'The Biggest Mistake',
        narrationText: `Ninety percent of people fail here because they try to do everything manually instead of building systems.`,
        keyVisualPoints: ['Manual burnout vs automation', 'Scaling with intelligent tools'],
        themeColor: '#f59e0b',
        icon: 'alert-triangle',
        durationSec: 7,
      },
      {
        sceneNumber: 4,
        header: 'Your Action Plan',
        narrationText: `Start today with one simple adjustment and watch your progress compound faster than ever before.`,
        keyVisualPoints: ['Step 1: Set up the automated triggers', 'Step 2: Monitor analytics'],
        themeColor: '#10b981',
        icon: 'trending-up',
        durationSec: 6,
      },
      {
        sceneNumber: 5,
        header: 'Subscribe & Grow',
        narrationText: `Hit the like button, subscribe to the channel, and comment below with your thoughts!`,
        keyVisualPoints: ['Drop a comment below', 'Hit notification bell for new videos'],
        themeColor: '#ef4444',
        icon: 'play',
        durationSec: 5,
      },
    ],
    thumbnailIdea: {
      headline: safeTopic.toUpperCase().slice(0, 24),
      subtitle: 'CHANGES EVERYTHING!',
      badge: 'VIRAL',
      accentColor: '#dc2626',
    },
  };
}

// In development, hook Vite middleware
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AutoTube Server listening on http://0.0.0.0:${PORT}`);
});
