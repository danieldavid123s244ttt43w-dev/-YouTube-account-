import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateVoiceInput,
  formatCount,
  formatSeconds,
  calculateTotalDuration,
  sanitizeVideoTitle,
  buildYouTubeUploadPayload,
  estimateReadingTime,
} from './pipeline';

test('validateVoiceInput rejects null, empty, or too short input', () => {
  assert.equal(validateVoiceInput(null).valid, false);
  assert.equal(validateVoiceInput('').valid, false);
  assert.equal(validateVoiceInput('  hi ').valid, false);
  const ok = validateVoiceInput('Top 5 AI tools of 2026');
  assert.equal(ok.valid, true);
  assert.equal(ok.cleaned, 'Top 5 AI tools of 2026');
});

test('formatCount formats subscriber and view counts cleanly', () => {
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(450), '450');
  assert.equal(formatCount(1500), '1.5K');
  assert.equal(formatCount(1200000), '1.2M');
  assert.equal(formatCount('34500000'), '34.5M');
});

test('formatSeconds converts seconds into M:SS', () => {
  assert.equal(formatSeconds(0), '0:00');
  assert.equal(formatSeconds(9), '0:09');
  assert.equal(formatSeconds(65), '1:05');
  assert.equal(formatSeconds(125), '2:05');
});

test('calculateTotalDuration sums scene durations correctly', () => {
  const scenes = [
    { sceneNumber: 1, header: 'A', narrationText: 'A', keyVisualPoints: [], themeColor: '#000', icon: 'zap', durationSec: 7 },
    { sceneNumber: 2, header: 'B', narrationText: 'B', keyVisualPoints: [], themeColor: '#000', icon: 'cpu', durationSec: 8 },
    { sceneNumber: 3, header: 'C', narrationText: 'C', keyVisualPoints: [], themeColor: '#000', icon: 'play', durationSec: 10 },
  ];
  assert.equal(calculateTotalDuration(scenes), 25);
  assert.equal(calculateTotalDuration([]), 0);
});

test('sanitizeVideoTitle limits title to safe YouTube lengths', () => {
  const shortTitle = 'Awesome Tech Review';
  assert.equal(sanitizeVideoTitle(shortTitle), shortTitle);
  const longTitle = 'A'.repeat(120);
  const sanitized = sanitizeVideoTitle(longTitle);
  assert.ok(sanitized.length <= 95);
  assert.ok(sanitized.endsWith('...'));
});

test('buildYouTubeUploadPayload prepares valid YouTube Data API metadata', () => {
  const payload = buildYouTubeUploadPayload(
    {
      topic: 'AI Automation',
      hook: 'Watch this',
      title: 'Top AI Secrets for 2026',
      description: 'Full automated video',
      tags: ['ai', 'tech', 'code'],
      category: 'Science & Technology',
      estimatedDurationSec: 30,
      scenes: [],
      thumbnailIdea: { headline: 'AI', subtitle: 'Secrets', badge: 'NEW', accentColor: '#ff0000' },
    },
    'public'
  );

  assert.equal(payload.snippet.title, 'Top AI Secrets for 2026');
  assert.equal(payload.status.privacyStatus, 'public');
  assert.deepEqual(payload.snippet.tags, ['ai', 'tech', 'code']);
  assert.equal(payload.status.selfDeclaredMadeForKids, false);
});

test('estimateReadingTime calculates reasonable speaking pace', () => {
  const shortText = 'One two three four.';
  assert.ok(estimateReadingTime(shortText) >= 3);
  const sentence = 'The development of artificial intelligence in 2026 is revolutionizing modern workflows across every single industry in remarkable ways.';
  const time = estimateReadingTime(sentence, 120);
  assert.ok(time >= 8 && time <= 15);
});
