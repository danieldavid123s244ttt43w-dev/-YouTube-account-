import React from 'react';
import { Youtube, Mic, Radio, Settings, LogOut, CheckCircle2, Sparkles } from 'lucide-react';
import { ChannelInfo } from '../types';

interface NavbarProps {
  activeTab: 'studio' | 'channel' | 'settings';
  setActiveTab: (tab: 'studio' | 'channel' | 'settings') => void;
  channel: ChannelInfo | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  channel,
  isAuthenticated,
  isLoggingIn,
  onLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-lg shadow-red-600/25">
            <Youtube className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                AutoTube
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                AI Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Automated YouTube Studio</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'studio'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('channel')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'channel'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Channel Manager</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Automation Settings</span>
          </button>
        </nav>

        {/* User / Channel Authentication Status */}
        <div className="flex items-center gap-3">
          {isAuthenticated && channel ? (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 py-1 px-2.5 rounded-xl">
              <img
                src={channel.avatarUrl}
                alt={channel.title}
                className="w-8 h-8 rounded-full border border-red-500/40 object-cover"
              />
              <div className="hidden lg:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white max-w-[120px] truncate">{channel.title}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                </div>
                <span className="text-[10px] text-slate-400">{channel.subscriberCount} subs</span>
              </div>
              <button
                onClick={onLogout}
                title="Disconnect YouTube account"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {channel?.isDemo && (
                <div className="hidden xl:flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sandbox Channel Mode</span>
                </div>
              )}
              {/* Google Sign-in button styled according to Google identity guidelines */}
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-semibold text-xs sm:text-sm rounded-xl shadow-md transition disabled:opacity-70 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Connecting...' : 'Connect YouTube'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
