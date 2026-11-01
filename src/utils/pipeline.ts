import { GeneratedContent, SceneItem } from '../types';

/**
 * Validates and normalizes voice prompt input
 */
export function validateVoiceInput(input?: string | null): { valid: boolean; cleaned: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, cleaned: '', error: 'Please speak or enter a video topic or prompt.' };
  }
  const cleaned = input.trim();
  if (cleaned.length < 3) {
    return { valid: false, cleaned, error: 'Voice prompt is too short. Please provide at least 3 characters.' };
  }
  return { valid: true, cleaned };
}

/**
 * Formats large view and subscriber counts (e.g. 1250000 -> "1.25M")
 */
export function formatCount(count: number | string | undefined | null): string {
  if (count === undefined || count === null || count === '') return '0';
  if (typeof count === 'string') {
    if (count.endsWith('K') || count.endsWith('M') || count.endsWith('B')) {
      return count;
    }
    const num = parseInt(count, 10);
    if (isNaN(num)) return count;
    return formatCount(num);
  }
  const num = count;

  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1);
    return `${val.endsWith('.0') ? val.slice(0, -2) : val}M`;
  }
  if (num >= 1_000) {
    const val = (num / 1_000).toFixed(1);
    return `${val.endsWith('.0') ? val.slice(0, -2) : val}K`;
  }
  return num.toLocaleString();
}

/**
 * Formats duration in seconds to M:SS format
 */
export function formatSeconds(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Calculates total duration from scenes
 */
export function calculateTotalDuration(scenes: SceneItem[]): number {
  if (!Array.isArray(scenes) || scenes.length === 0) return 0;
  return scenes.reduce((acc, scene) => acc + (scene.durationSec || 5), 0);
}

/**
 * Ensures title conforms to YouTube character limits (max 100 chars)
 */
export function sanitizeVideoTitle(title: string): string {
  if (!title) return 'Auto-Generated YouTube Video';
  const trimmed = title.trim();
  if (trimmed.length > 95) {
    return trimmed.slice(0, 92) + '...';
  }
  return trimmed;
}

/**
 * Builds standard YouTube Data API v3 upload metadata snippet and status
 */
export function buildYouTubeUploadPayload(
  content: GeneratedContent,
  privacy: 'public' | 'unlisted' | 'private' = 'unlisted'
) {
  const title = sanitizeVideoTitle(content.title || `${content.topic} - Full Breakdown`);
  const safeTags = Array.isArray(content.tags) && content.tags.length > 0 ? content.tags : ['youtube', 'automation'];

  return {
    snippet: {
      title,
      description: content.description || `Automated video covering ${content.topic}. Created with AutoTube Studio.`,
      tags: safeTags.slice(0, 15),
      categoryId: '28', // Science & Technology
    },
    status: {
      privacyStatus: privacy,
      selfDeclaredMadeForKids: false,
    },
  };
}

/**
 * Estimates reading time in seconds based on average speaking rate (140 words per minute)
 */
export function estimateReadingTime(text: string, wordsPerMinute = 140): number {
  if (!text) return 4;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.ceil((words / wordsPerMinute) * 60);
  return Math.max(3, seconds);
}
