import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Zap,
  Volume2,
  Film,
  Layers,
  ArrowRight,
  Share2,
  Eye,
  Clock,
  Radio,
  Sliders,
} from 'lucide-react';
import {
  GeneratedContent,
  PipelineStep,
  ChannelInfo,
  AutomationSettings,
  SceneItem,
} from '../types';
import {
  speakAssistantPrompt,
  speakNarrationText,
  stopSpeaking,
  startVoiceRecognition,
  SAMPLE_VOICE_PROMPTS,
  VoiceRecognitionController,
} from '../services/voiceAssistant';
import { generateVideoBlob, drawSceneFrame } from '../utils/videoRenderer';
import { uploadVideoToYouTube } from '../services/youtubeApi';
import { ConfirmationModal } from './ConfirmationModal';
import { formatSeconds } from '../utils/pipeline';

interface VoiceStudioProps {
  channel: ChannelInfo | null;
  accessToken: string | null;
  settings: AutomationSettings;
  onVideoPublished: (videoData: any) => void;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({
  channel,
  accessToken,
  settings,
  onVideoPublished,
}) => {
  // Voice Input State
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [assistantSpoken, setAssistantSpoken] = useState(false);
  const [isAssistantTalking, setIsAssistantTalking] = useState(false);
  const recognitionRef = useRef<VoiceRecognitionController | null>(null);

  // Pipeline State
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineMessage, setPipelineMessage] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [publishedVideoUrl, setPublishedVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video Player Preview State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [playerProgress, setPlayerProgress] = useState(0); // 0 to 1
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number>(0);

  // Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // 1. "Ask for Voice" Trigger
  const handleAskForVoice = async () => {
    setErrorMessage(null);
    setIsAssistantTalking(true);

    if (settings.enableVoicePromptSound) {
      await speakAssistantPrompt(
        "I'm listening. Tell me the topic or voice idea for your next YouTube video."
      );
    }
    setIsAssistantTalking(false);
    setAssistantSpoken(true);
    startRecording();
  };

  // 2. Microphone Recording
  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setVoiceText('');
    setIsListening(true);
    setPipelineStep('listening');

    recognitionRef.current = startVoiceRecognition({
      onTranscript: (transcript, isFinal) => {
        setVoiceText(transcript);
        if (isFinal && transcript.trim().length > 15) {
          // Automatic voice-end detection
        }
      },
      onError: (err) => {
        console.warn('Speech recognition notice:', err);
        setIsListening(false);
        if (pipelineStep === 'listening') setPipelineStep('idle');
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    if (pipelineStep === 'listening') setPipelineStep('idle');
  };

  // 3. Full Automatic Execution: Voice -> Script -> Video -> Publish
  const handleRunFullAutomaticPipeline = async (overridePrompt?: string) => {
    const promptToUse = (overridePrompt || voiceText).trim();
    if (!promptToUse) {
      setErrorMessage('Please record your voice or pick a topic to start.');
      return;
    }

    stopRecording();
    stopSpeaking();
    setErrorMessage(null);
    setPublishedVideoUrl(null);
    setPipelineProgress(5);
    setPipelineStep('transcribing');
    setPipelineMessage('Analyzing voice intent and target audience retention...');

    try {
      // Step A: Script & Scene Generation via Gemini Backend
      setPipelineProgress(20);
      setPipelineStep('scripting');
      setPipelineMessage('Gemini AI generating high-retention script, hook & SEO tags...');

      const scriptRes = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voicePrompt: promptToUse,
          format: settings.aspectRatio,
          persona: settings.voicePersona,
          channelContext: channel ? `${channel.title} - ${channel.description}` : '',
        }),
      });

      if (!scriptRes.ok) {
        throw new Error(`Server returned error ${scriptRes.status}`);
      }

      const resJson = await scriptRes.json();
      const content: GeneratedContent = resJson.data;
      setGeneratedContent(content);

      // Step B: Synthesizing Video Scenes & Audio
      setPipelineProgress(45);
      setPipelineStep('rendering_video');
      setPipelineMessage('Rendering animated scene frames & synthesizing voice audio...');

      const renderResult = await generateVideoBlob(content, {
        aspectRatio: settings.aspectRatio,
        channelName: channel?.title || 'AutoTube Studio',
        onProgress: (pct, msg) => {
          setPipelineProgress(45 + Math.round((pct / 100) * 35));
          setPipelineMessage(msg);
        },
      });

      setVideoBlob(renderResult.blob);
      setVideoBlobUrl(renderResult.url);
      setPipelineProgress(85);

      // Step C: Auto-Upload or Confirmation
      if (settings.autoUploadAfterVoice && accessToken) {
        // Direct auto-publish
        await executeYouTubeUpload(renderResult.blob, content);
      } else {
        setPipelineProgress(100);
        setPipelineStep('ready_to_publish');
        setPipelineMessage('Video rendered and ready for YouTube upload!');
        setActiveSceneIndex(0);
        setIsPlaying(false);
      }
    } catch (err: any) {
      console.error('Pipeline error:', err);
      setPipelineStep('failed');
      setErrorMessage(err.message || 'Pipeline failed during processing.');
    }
  };

  // 4. YouTube Upload Execution
  const executeYouTubeUpload = async (blob: Blob, content: GeneratedContent) => {
    setIsUploading(true);
    setUploadProgress(10);
    setPipelineStep('uploading');
    setPipelineMessage('Connecting to YouTube Data API & uploading video file...');

    try {
      if (accessToken && !channel?.isDemo) {
        const uploadResult = await uploadVideoToYouTube(
          accessToken,
          blob,
          {
            title: content.title,
            description: content.description,
            tags: content.tags,
            privacy: settings.defaultPrivacy,
          },
          (pct) => setUploadProgress(pct)
        );

        setPublishedVideoUrl(uploadResult.watchUrl);
        setPipelineProgress(100);
        setPipelineStep('published');
        setPipelineMessage(`Successfully published to ${channel?.title || 'YouTube'}!`);
        setIsConfirmModalOpen(false);

        onVideoPublished({
          id: uploadResult.videoId,
          title: content.title,
          description: content.description,
          publishedAt: new Date().toISOString(),
          thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          privacyStatus: settings.defaultPrivacy,
          isAutoGenerated: true,
        });
      } else {
        // High fidelity sandbox simulation for immediate interactive testing without live channel credentials
        for (let p = 15; p <= 100; p += 25) {
          await new Promise((r) => setTimeout(r, 200));
          setUploadProgress(p);
        }

        const simulatedId = 'autotube_' + Math.random().toString(36).substring(2, 9);
        const simUrl = `https://youtube.com/watch?v=${simulatedId}`;
        setPublishedVideoUrl(simUrl);
        setPipelineProgress(100);
        setPipelineStep('published');
        setPipelineMessage(`Published successfully to sandbox channel (${channel?.title || 'AutoTube Studio'})!`);
        setIsConfirmModalOpen(false);

        onVideoPublished({
          id: simulatedId,
          title: content.title,
          description: content.description,
          publishedAt: new Date().toISOString(),
          thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          privacyStatus: settings.defaultPrivacy,
          isAutoGenerated: true,
        });
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(`Upload error: ${err.message}`);
      setPipelineStep('ready_to_publish');
    } finally {
      setIsUploading(false);
    }
  };

  // 5. Canvas Video Player Live Preview & Narration
  const startCanvasPlayback = (content: GeneratedContent, startingSceneIndex = 0) => {
    if (!content || !content.scenes || content.scenes.length === 0) return;

    setIsPlaying(true);
    setActiveSceneIndex(startingSceneIndex);
    playStartTimeRef.current = performance.now();

    const currentScene = content.scenes[startingSceneIndex];
    speakNarrationText(currentScene.narrationText, () => {
      // Advance to next scene automatically when speech ends
      if (startingSceneIndex < content.scenes.length - 1) {
        startCanvasPlayback(content, startingSceneIndex + 1);
      } else {
        setIsPlaying(false);
      }
    });

    const isShorts = settings.aspectRatio === 'shorts';
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const durationMs = (currentScene.durationSec || 5) * 1000;

    const loop = (now: number) => {
      const elapsed = now - playStartTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);

      // Direct DOM update for smooth bar without React thrash
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progress * 100}%`;
      }

      drawSceneFrame(
        ctx,
        canvas.width,
        canvas.height,
        currentScene,
        startingSceneIndex,
        content.scenes.length,
        progress,
        isShorts,
        channel?.title || 'AutoTube Studio',
        content.topic
      );

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        setIsPlaying(false);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(loop);
  };

  const togglePlayback = () => {
    if (!generatedContent) return;
    if (isPlaying) {
      stopSpeaking();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setIsPlaying(false);
    } else {
      startCanvasPlayback(generatedContent, activeSceneIndex);
    }
  };

  const handleSelectScene = (idx: number) => {
    if (!generatedContent) return;
    stopSpeaking();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    startCanvasPlayback(generatedContent, idx);
  };

  // Render static frame when scene changes or player idle
  useEffect(() => {
    if (generatedContent && canvasRef.current && !isPlaying) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const isShorts = settings.aspectRatio === 'shorts';
        const scene = generatedContent.scenes[activeSceneIndex] || generatedContent.scenes[0];
        if (scene) {
          drawSceneFrame(
            ctx,
            canvasRef.current.width,
            canvasRef.current.height,
            scene,
            activeSceneIndex,
            generatedContent.scenes.length,
            0.5,
            isShorts,
            channel?.title || 'AutoTube Studio',
            generatedContent.topic
          );
        }
      }
    }
  }, [generatedContent, activeSceneIndex, settings.aspectRatio]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Voice Prompt Hero Assistant Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        {/* Ambient glow backgrounds */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold tracking-wide uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
            <span>Voice-to-YouTube Automatic Pipeline</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Speak your idea. We build and publish your video{' '}
            <span className="bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              full automatic.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            When you ask for voice, the AI assistant prompts you, analyzes your topic, writes viral hooks, renders animated scene frames, and puts the finished video straight on your YouTube channel.
          </p>

          {/* Voice Prompt Action Center */}
          <div className="w-full flex flex-col items-center gap-4 pt-2">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing wave rings */}
              {(isListening || isAssistantTalking) && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-red-500/20 animate-ping duration-1000" />
                  <div className="absolute w-48 h-48 rounded-full bg-rose-500/10 animate-pulse duration-1500" />
                </>
              )}

              <button
                onClick={isListening ? stopRecording : handleAskForVoice}
                aria-label={isListening ? 'Stop listening' : 'Ask for voice and speak video idea'}
                className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white shadow-red-600/50 scale-105 animate-pulse'
                    : isAssistantTalking
                    ? 'bg-amber-500 text-white shadow-amber-500/40'
                    : 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white hover:shadow-red-600/40 hover:scale-105'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {isListening
                  ? '🎙️ Listening to your voice... Speak freely!'
                  : isAssistantTalking
                  ? '🔊 Assistant is speaking...'
                  : 'Tap the microphone or button below to speak'}
              </span>
            </div>

            {/* Quick Trigger Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleAskForVoice}
                disabled={isListening || isAssistantTalking}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm border border-slate-700 transition cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-rose-400" />
                <span>"Ask Me For Voice" Prompt</span>
              </button>

              <button
                onClick={() => handleRunFullAutomaticPipeline()}
                disabled={!voiceText.trim() || pipelineStep === 'transcribing' || pipelineStep === 'scripting' || pipelineStep === 'rendering_video'}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 active:from-red-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Auto Make & Put In YouTube</span>
              </button>
            </div>

            {/* Live Transcript / Prompt Input Box */}
            <div className="w-full mt-4 text-left">
              <label htmlFor="voice-prompt-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Voice Input & Idea Transcript:
              </label>
              <div className="relative">
                <textarea
                  id="voice-prompt-input"
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder="Your voice transcript will appear here in real time, or you can type/edit your idea..."
                  rows={2}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 resize-none transition"
                />
                {voiceText && (
                  <button
                    onClick={() => setVoiceText('')}
                    className="absolute top-3 right-3 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Sample Voice Ideas Chips for Instant Testing */}
            <div className="w-full text-left space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-400">
                Or pick a trending sample voice prompt:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_VOICE_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setVoiceText(sample);
                      handleRunFullAutomaticPipeline(sample);
                    }}
                    className="text-xs bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white py-1.5 px-3 rounded-lg border border-slate-700/60 transition truncate max-w-full text-left cursor-pointer"
                  >
                    💡 "{sample}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Pipeline Execution Progress Bar */}
      {pipelineStep !== 'idle' && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
                <Zap className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Automation Pipeline Execution
                </h3>
                <p className="text-xs text-slate-400">{pipelineMessage}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-red-400">{pipelineProgress}%</span>
            </div>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${pipelineProgress}%` }}
            />
          </div>

          {/* Stepper Status Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-xs">
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                pipelineStep === 'transcribing' || pipelineProgress >= 20
                  ? 'bg-slate-800/80 border-red-500/50 text-white'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-red-400" />
              <span className="truncate">1. Voice Intent</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                pipelineStep === 'scripting' || pipelineProgress >= 45
                  ? 'bg-slate-800/80 border-red-500/50 text-white'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate">2. AI Script & Hook</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                pipelineStep === 'rendering_video' || pipelineProgress >= 85
                  ? 'bg-slate-800/80 border-red-500/50 text-white'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">3. Canvas Video</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                pipelineStep === 'uploading' || pipelineStep === 'published'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">4. YouTube Publish</span>
            </div>
          </div>

          {/* Success Banner */}
          {pipelineStep === 'published' && publishedVideoUrl && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold">
                  Video has been automatically put on YouTube!
                </span>
              </div>
              <a
                href={publishedVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-md"
              >
                <span>Watch on YouTube</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </section>
      )}

      {/* 3. Generated Video Studio Preview & Storyboard */}
      {generatedContent && (
        <div id="video-studio-preview" className="grid grid-cols-1 lg:grid-cols-12 gap-8 scroll-mt-24">
          {/* Left: Video Player Surface */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {settings.aspectRatio === 'shorts' ? 'YouTube Shorts (9:16)' : 'Standard (16:9)'} Player
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {formatSeconds(generatedContent.estimatedDurationSec)}
                </span>
              </div>

              {/* Canvas Render Surface */}
              <div className="relative mx-auto rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={settings.aspectRatio === 'shorts' ? 720 : 1280}
                  height={settings.aspectRatio === 'shorts' ? 1280 : 720}
                  className={`w-full object-contain ${
                    settings.aspectRatio === 'shorts' ? 'max-h-[520px] aspect-[9/16]' : 'aspect-video'
                  }`}
                />

                {/* Overlay Play/Pause Button on Hover */}
                {!isPlaying && (
                  <button
                    onClick={togglePlayback}
                    aria-label="Play video preview"
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Play className="w-7 h-7 ml-1" />
                  </button>
                )}
              </div>

              {/* Player Controls Bar */}
              <div className="space-y-2">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    ref={progressBarRef}
                    className="bg-red-500 h-1.5 rounded-full transition-all duration-75"
                    style={{ width: `${playerProgress * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlayback}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleSelectScene(0)}
                      className="p-2 text-slate-400 hover:text-white rounded-lg transition"
                      title="Replay from start"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-300">
                      Scene {activeSceneIndex + 1} of {generatedContent.scenes.length}
                    </span>
                  </div>

                  {/* Actions: Download Video & Upload to YouTube */}
                  <div className="flex items-center gap-2">
                    {videoBlobUrl && (
                      <a
                        href={videoBlobUrl}
                        download={`${generatedContent.topic.replace(/\s+/g, '_')}.webm`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export</span>
                      </a>
                    )}

                    <button
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-md shadow-red-600/30 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Put on YouTube</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail Generator Card */}
            {generatedContent.thumbnailIdea && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Auto Thumbnail Preview</span>
                  </div>
                  <span className="text-amber-400 font-bold px-2 py-0.5 bg-amber-400/10 rounded">
                    High CTR
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-tr from-slate-950 via-slate-900 to-red-950 p-4 flex flex-col justify-between border border-slate-700 shadow-inner">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 text-[11px] font-black uppercase rounded bg-red-600 text-white shadow-md">
                      {generatedContent.thumbnailIdea.badge || 'VIRAL'}
                    </span>
                    <span className="text-[10px] text-white/70 font-semibold">4K ULTRA HD</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xl sm:text-2xl font-black text-white leading-tight uppercase drop-shadow-md">
                      {generatedContent.thumbnailIdea.headline}
                    </h4>
                    <p className="text-xs font-extrabold text-amber-400 uppercase tracking-wider drop-shadow">
                      {generatedContent.thumbnailIdea.subtitle}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{channel?.title || 'AutoTube Studio'}</span>
                    <span>1080p WebM</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Metadata & Scene Storyboard */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title & Metadata Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {generatedContent.category}
                </span>
                <span className="text-xs text-slate-400">
                  Target Duration: ~{generatedContent.estimatedDurationSec}s
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  YouTube Video Title:
                </label>
                <h3 className="text-xl font-bold text-white mt-1">
                  {generatedContent.title}
                </h3>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Hook (First 3 Seconds):
                </label>
                <p className="text-sm text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mt-1">
                  "{generatedContent.hook}"
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Description:
                </label>
                <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-950/60 p-3 rounded-xl mt-1 border border-slate-800/80 max-h-28 overflow-y-auto">
                  {generatedContent.description}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tags & SEO Keywords:
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {generatedContent.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scene-by-Scene Storyboard */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Interactive Scene Storyboard ({generatedContent.scenes.length} Scenes)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Click any scene to preview & narrate</span>
              </div>

              <div className="space-y-3">
                {generatedContent.scenes.map((scene, idx) => {
                  const isActive = activeSceneIndex === idx;
                  return (
                    <div
                      key={scene.sceneNumber || idx}
                      onClick={() => handleSelectScene(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-800/90 border-red-500 ring-1 ring-red-500 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black text-white"
                            style={{ backgroundColor: scene.themeColor || '#6366f1' }}
                          >
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-white">{scene.header}</h4>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {scene.durationSec}s
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 italic mb-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        "{scene.narrationText}"
                      </div>

                      {scene.keyVisualPoints && scene.keyVisualPoints.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {scene.keyVisualPoints.map((pt, pidx) => (
                            <span
                              key={pidx}
                              className="text-[11px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                            >
                              • {pt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Workspace Compliance */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title={generatedContent?.title || 'Auto-Generated Video'}
        channelName={channel?.title || 'My YouTube Channel'}
        privacy={settings.defaultPrivacy}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onConfirm={() => {
          if (videoBlob && generatedContent) {
            executeYouTubeUpload(videoBlob, generatedContent);
          }
        }}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
};
