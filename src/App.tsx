import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VoiceStudio } from './components/VoiceStudio';
import { ChannelManager } from './components/ChannelManager';
import { AutomationSettingsView } from './components/AutomationSettingsModal';
import { ChannelInfo, YouTubeVideo, AutomationSettings } from './types';
import { initAuth, googleSignIn, logout as authLogout } from './services/firebaseAuth';
import {
  DEMO_CHANNEL,
  DEMO_VIDEOS,
  fetchMyChannel,
  fetchChannelVideos,
} from './services/youtubeApi';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'channel' | 'settings'>('studio');
  const [channel, setChannel] = useState<ChannelInfo>(DEMO_CHANNEL);
  const [videos, setVideos] = useState<YouTubeVideo[]>(DEMO_VIDEOS);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isLoadingChannel, setIsLoadingChannel] = useState<boolean>(false);

  const [settings, setSettings] = useState<AutomationSettings>(() => {
    try {
      const saved = localStorage.getItem('autotube_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      aspectRatio: 'shorts',
      defaultPrivacy: 'unlisted',
      voicePersona: 'energetic',
      autoUploadAfterVoice: false,
      backgroundMusic: 'ambient',
      enableVoicePromptSound: true,
    };
  });

  const handleUpdateSettings = (newSettings: AutomationSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('autotube_settings', JSON.stringify(newSettings));
    } catch {}
  };

  // Initialize Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      async (_user, token) => {
        setAccessToken(token);
        setIsAuthenticated(true);
        loadChannelData(token);
      },
      () => {
        setAccessToken(null);
        setIsAuthenticated(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadChannelData = async (token: string) => {
    setIsLoadingChannel(true);
    try {
      const channelInfo = await fetchMyChannel(token);
      setChannel(channelInfo);
      const channelVideos = await fetchChannelVideos(token);
      setVideos(channelVideos);
    } catch (err) {
      console.warn('Could not load channel data with token, falling back to demo channel:', err);
    } finally {
      setIsLoadingChannel(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setAccessToken(result.accessToken);
        setIsAuthenticated(true);
        await loadChannelData(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    setAccessToken(null);
    setIsAuthenticated(false);
    setChannel(DEMO_CHANNEL);
    setVideos(DEMO_VIDEOS);
  };

  const handleVideoPublished = (newVideo: YouTubeVideo) => {
    setVideos((prev) => [newVideo, ...prev]);
    if (channel) {
      const currentCount = parseInt(String(channel.videoCount), 10) || 0;
      setChannel({
        ...channel,
        videoCount: currentCount + 1,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        channel={channel}
        isAuthenticated={isAuthenticated}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'studio' && (
          <VoiceStudio
            channel={channel}
            accessToken={accessToken}
            settings={settings}
            onVideoPublished={handleVideoPublished}
          />
        )}

        {activeTab === 'channel' && (
          <ChannelManager
            channel={channel}
            videos={videos}
            onRecordNewVoice={() => setActiveTab('studio')}
            onRefresh={() => {
              if (accessToken) loadChannelData(accessToken);
            }}
            isLoading={isLoadingChannel}
          />
        )}

        {activeTab === 'settings' && (
          <AutomationSettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">AutoTube Studio</span>
            <span>—</span>
            <span>Voice-to-YouTube Content Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Official YouTube Data API v3</span>
            <span>•</span>
            <span>Gemini AI Multimodal</span>
            <span>•</span>
            <span>Client OAuth Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
