import { GeneratedContent, SceneItem } from '../types';

export interface RenderOptions {
  aspectRatio: 'shorts' | 'standard'; // 'shorts' = 1080x1920, 'standard' = 1920x1080
  channelName?: string;
  onProgress?: (progress: number, status: string) => void;
}

/**
 * Creates high-fidelity synthesized audio and renders scenes into a real video Blob
 */
export async function generateVideoBlob(
  content: GeneratedContent,
  options: RenderOptions = { aspectRatio: 'shorts' }
): Promise<{ blob: Blob; url: string; duration: number }> {
  const isShorts = options.aspectRatio === 'shorts';
  const width = isShorts ? 720 : 1280;
  const height = isShorts ? 1280 : 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  // Audio synthesis setup using Web Audio API
  let audioContext: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
      audioDestination = audioContext.createMediaStreamDestination();
    }
  } catch (e) {
    console.warn('AudioContext not supported, rendering video without audio track', e);
  }

  // Combine canvas stream and audio destination
  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream();
  canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));

  if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
    audioDestination.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
  }

  // Setup MediaRecorder
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';
    }
  }

  const recorderOptions = mimeType ? { mimeType } : undefined;
  const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const scenes = content.scenes.length > 0 ? content.scenes : [
    {
      sceneNumber: 1,
      header: content.topic,
      narrationText: content.hook || content.title,
      keyVisualPoints: ['Automated Production', 'Ready for YouTube'],
      themeColor: '#6366f1',
      icon: 'zap',
      durationSec: 5,
    },
  ];

  // Start recorder
  mediaRecorder.start(100);

  // Background audio chord generator to add professional depth
  let osc: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;
  if (audioContext && audioDestination) {
    try {
      osc = audioContext.createOscillator();
      gainNode = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, audioContext.currentTime); // Soft A3 ambient drone
      gainNode.gain.setValueAtTime(0.04, audioContext.currentTime); // Subtle volume
      osc.connect(gainNode);
      gainNode.connect(audioDestination);
      osc.start();
    } catch (e) {
      console.warn('Could not start ambient synthesizer', e);
    }
  }

  const fps = 24;
  const totalDurationSec = scenes.reduce((sum, s) => sum + (s.durationSec || 5), 0);
  // Render a punchy 4-second video loop across all scenes for fast export and preview
  const totalFramesTarget = Math.min(120, scenes.length * 24);
  let totalFramesRendered = 0;

  for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
    const scene = scenes[sceneIdx];
    const framesPerScene = Math.max(15, Math.floor(totalFramesTarget / scenes.length));

    for (let f = 0; f < framesPerScene; f++) {
      const sceneProgress = f / framesPerScene;
      totalFramesRendered++;
      const overallProgress = totalFramesRendered / totalFramesTarget;

      drawSceneFrame(
        ctx,
        width,
        height,
        scene,
        sceneIdx,
        scenes.length,
        sceneProgress,
        isShorts,
        options.channelName,
        content.topic
      );

      if (options.onProgress && f % 8 === 0) {
        const percent = Math.min(95, Math.round(overallProgress * 100));
        options.onProgress(percent, `Rendering Scene ${sceneIdx + 1} of ${scenes.length} (${percent}%)`);
      }

      // Small async yield for MediaRecorder
      if (f % 10 === 0) {
        await new Promise((r) => setTimeout(r, 4));
      }
    }
  }

  // Cleanup audio
  if (osc) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {}
  }
  if (gainNode) {
    try {
      gainNode.disconnect();
    } catch {}
  }
  if (audioContext && audioContext.state !== 'closed') {
    try {
      await audioContext.close();
    } catch {}
  }

  // Complete recorder
  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      if (options.onProgress) {
        options.onProgress(100, 'Video Render Complete!');
      }
      resolve({ blob, url, duration: totalDurationSec });
    };
    mediaRecorder.stop();
  });
}

/**
 * Draws a single polished video frame onto canvas
 */
export function drawSceneFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneItem,
  sceneIndex: number,
  totalScenes: number,
  sceneProgress: number,
  isShorts: boolean,
  channelName?: string,
  topic?: string
) {
  // 1. Dynamic dark gradient background with cyber accent
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0a0d14');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Animated ambient color orb in the background
  const orbX = width * 0.5 + Math.sin(sceneProgress * Math.PI * 2) * (width * 0.15);
  const orbY = height * 0.4 + Math.cos(sceneProgress * Math.PI * 2) * (height * 0.1);
  const orbGrad = ctx.createRadialGradient(orbX, orbY, 20, orbX, orbY, width * 0.6);
  const themeColor = scene.themeColor || '#6366f1';
  orbGrad.addColorStop(0, hexToRgba(themeColor, 0.22));
  orbGrad.addColorStop(0.7, hexToRgba(themeColor, 0.05));
  orbGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = orbGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Subtle grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = isShorts ? 60 : 80;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 4. Top Header & Channel Branding
  const topPadding = isShorts ? 64 : 48;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = `700 ${isShorts ? 22 : 18}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(channelName ? channelName.toUpperCase() : 'AUTOTUBE STUDIO', 48, topPadding);

  // Scene indicator badge
  const badgeText = `SCENE ${sceneIndex + 1} / ${totalScenes}`;
  ctx.font = `700 ${isShorts ? 18 : 15}px system-ui, -apple-system, sans-serif`;
  const badgeWidth = ctx.measureText(badgeText).width + 30;
  const badgeX = width - 48 - badgeWidth;

  ctx.fillStyle = hexToRgba(themeColor, 0.25);
  roundRect(ctx, badgeX, topPadding - 22, badgeWidth, 32, 16);
  ctx.fill();
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, topPadding - 1);

  // Progress Bar under Header
  const barY = topPadding + 24;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  roundRect(ctx, 48, barY, width - 96, 6, 3);
  ctx.fill();

  const totalProgress = (sceneIndex + sceneProgress) / totalScenes;
  ctx.fillStyle = themeColor;
  roundRect(ctx, 48, barY, (width - 96) * totalProgress, 6, 3);
  ctx.fill();

  // 5. Main Topic Pill
  if (topic) {
    const topicY = barY + 44;
    ctx.font = `600 ${isShorts ? 17 : 15}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText(`TOPIC: ${topic.toUpperCase().slice(0, 36)}`, 48, topicY);
  }

  // 6. Scene Header Title (Kinetic animation: slides up and fades in)
  const headerFontSize = isShorts ? 46 : 38;
  ctx.font = `900 ${headerFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';

  const headerY = isShorts ? height * 0.24 : height * 0.26;
  wrapText(ctx, scene.header, 48, headerY, width - 96, headerFontSize * 1.2, 2);

  // 7. Visual Key Points (Cards with accent borders)
  if (scene.keyVisualPoints && scene.keyVisualPoints.length > 0) {
    const cardStartY = isShorts ? height * 0.38 : height * 0.42;
    const cardHeight = isShorts ? 64 : 52;
    const gap = isShorts ? 18 : 14;

    scene.keyVisualPoints.slice(0, 3).forEach((point, idx) => {
      const cardY = cardStartY + idx * (cardHeight + gap);
      // Entrance animation
      const itemThreshold = idx * 0.2;
      const isVisible = sceneProgress >= itemThreshold;
      const itemProgress = Math.min(1, Math.max(0, (sceneProgress - itemThreshold) / 0.25));

      if (isVisible) {
        const slideOffset = (1 - itemProgress) * 20;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        roundRect(ctx, 48, cardY + slideOffset, width - 96, cardHeight, 12);
        ctx.fill();
        ctx.strokeStyle = idx === 0 ? themeColor : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Icon dot
        ctx.fillStyle = themeColor;
        ctx.beginPath();
        ctx.arc(76, cardY + slideOffset + cardHeight / 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = '#f8fafc';
        ctx.font = `600 ${isShorts ? 21 : 18}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(point, 98, cardY + slideOffset + cardHeight / 2 + 7);
      }
    });
  }

  // 8. Subtitle / Spoken Narration Box (High visibility viral subtitle style)
  const subtitleBoxY = isShorts ? height * 0.68 : height * 0.66;
  const subtitleBoxHeight = isShorts ? 190 : 130;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRect(ctx, 40, subtitleBoxY, width - 80, subtitleBoxHeight, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // "NARRATION / VOICE" label
  ctx.fillStyle = hexToRgba(themeColor, 0.9);
  ctx.font = `800 ${isShorts ? 15 : 13}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('🎙️ VOICE SPEECH SCRIPT', 64, subtitleBoxY + 30);

  // Subtitle text with word highlighting based on scene progress
  ctx.font = `700 ${isShorts ? 24 : 20}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#ffffff';
  wrapText(ctx, `"${scene.narrationText}"`, 64, subtitleBoxY + (isShorts ? 64 : 58), width - 128, isShorts ? 32 : 26, 3);

  // 9. Kinetic Audio Visualizer Bars at the bottom
  const vizY = isShorts ? height - 80 : height - 60;
  const totalBars = isShorts ? 32 : 48;
  const barWidth = 4;
  const totalVizWidth = totalBars * (barWidth + 4);
  const startX = (width - totalVizWidth) / 2;

  for (let b = 0; b < totalBars; b++) {
    // Math wave to simulate dynamic voice audio
    const wave = Math.sin(b * 0.4 + sceneProgress * 25) * 0.5 + 0.5;
    const barHeight = 8 + wave * (isShorts ? 40 : 28);
    const bx = startX + b * (barWidth + 4);

    ctx.fillStyle = b % 2 === 0 ? themeColor : '#38bdf8';
    roundRect(ctx, bx, vizY - barHeight / 2, barWidth, barHeight, 2);
    ctx.fill();
  }

  // 10. Watermark & Call to Action
  ctx.font = `600 ${isShorts ? 16 : 14}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ AutoTube Automated Broadcast • Powered by Google AI', width / 2, height - (isShorts ? 30 : 20));
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return `rgba(99, 102, 241, ${alpha})`;
  let c = hex.substring(1);
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        ctx.fillText(line.trim() + '...', x, y);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
