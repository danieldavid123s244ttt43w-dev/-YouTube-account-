import React from 'react';
import {
  Sliders,
  X,
  Smartphone,
  Tv,
  Eye,
  Lock,
  Globe,
  Mic,
  Music,
  Zap,
  Volume2,
  CheckCircle,
} from 'lucide-react';
import { AutomationSettings } from '../types';

interface AutomationSettingsModalProps {
  settings: AutomationSettings;
  onUpdateSettings: (newSettings: AutomationSettings) => void;
  onClose?: () => void;
}

export const AutomationSettingsView: React.FC<AutomationSettingsModalProps> = ({
  settings,
  onUpdateSettings,
}) => {
  return (
    <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div className="p-3 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
          <Sliders className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Automation & Pipeline Preferences
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Control video formats, voice personas, privacy settings, and automated publishing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Video Aspect Ratio */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Output Video Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdateSettings({ ...settings, aspectRatio: 'shorts' })}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition cursor-pointer ${
                settings.aspectRatio === 'shorts'
                  ? 'bg-red-600/20 border-red-500 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-6 h-6 text-red-400" />
              <div>
                <span className="text-sm font-bold block">YouTube Shorts</span>
                <span className="text-[10px] text-slate-400">9:16 Vertical (1080x1920)</span>
              </div>
            </button>

            <button
              onClick={() => onUpdateSettings({ ...settings, aspectRatio: 'standard' })}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition cursor-pointer ${
                settings.aspectRatio === 'standard'
                  ? 'bg-red-600/20 border-red-500 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-6 h-6 text-indigo-400" />
              <div>
                <span className="text-sm font-bold block">Standard Video</span>
                <span className="text-[10px] text-slate-400">16:9 Landscape (1920x1080)</span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Default YouTube Privacy */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Default YouTube Upload Privacy
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'unlisted', label: 'Unlisted', desc: 'Anyone with link', icon: Eye },
                { id: 'public', label: 'Public', desc: 'Directly Live', icon: Globe },
                { id: 'private', label: 'Private', desc: 'Only you', icon: Lock },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const isSel = settings.defaultPrivacy === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onUpdateSettings({ ...settings, defaultPrivacy: opt.id })}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition cursor-pointer ${
                    isSel
                      ? 'bg-red-600/20 border-red-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className="text-[9px] text-slate-500">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Voice Persona */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-rose-400" />
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Creator Voice Persona
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(
              [
                { id: 'energetic', name: 'Energetic Viral', speed: 'Fast & Punchy' },
                { id: 'tech', name: 'Tech Host', speed: 'Crisp & Modern' },
                { id: 'authoritative', name: 'Deep Host', speed: 'Grounded & Deep' },
                { id: 'calm', name: 'Educator', speed: 'Clear & Engaging' },
              ] as const
            ).map((persona) => (
              <button
                key={persona.id}
                onClick={() => onUpdateSettings({ ...settings, voicePersona: persona.id })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.voicePersona === persona.id
                    ? 'bg-slate-800 border-red-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-white">{persona.name}</div>
                <div className="text-[10px] text-slate-400">{persona.speed}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Background Soundscape */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Background Audio Track
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(
              [
                { id: 'ambient', name: 'Ambient Synth' },
                { id: 'lofi', name: 'Lo-Fi Chill' },
                { id: 'cyber', name: 'Cyber Wave' },
                { id: 'none', name: 'No Background' },
              ] as const
            ).map((track) => (
              <button
                key={track.id}
                onClick={() => onUpdateSettings({ ...settings, backgroundMusic: track.id })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.backgroundMusic === track.id
                    ? 'bg-slate-800 border-amber-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-white">{track.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Autonomous Switches */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">Full Automatic Publish Mode</span>
            </div>
            <p className="text-xs text-slate-400">
              When toggled on, completing your voice prompt will generate, render, and automatically submit to YouTube without pausing.
            </p>
          </div>
          <button
            onClick={() =>
              onUpdateSettings({
                ...settings,
                autoUploadAfterVoice: !settings.autoUploadAfterVoice,
              })
            }
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              settings.autoUploadAfterVoice ? 'bg-red-600 justify-end' : 'bg-slate-800 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-slate-900 pt-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-bold text-white">Speak Voice Prompt Aloud</span>
            </div>
            <p className="text-xs text-slate-400">
              Assistant speaks: "Tell me the topic or voice idea for your next YouTube video."
            </p>
          </div>
          <button
            onClick={() =>
              onUpdateSettings({
                ...settings,
                enableVoicePromptSound: !settings.enableVoicePromptSound,
              })
            }
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              settings.enableVoicePromptSound ? 'bg-red-600 justify-end' : 'bg-slate-800 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </div>
    </div>
  );
};
