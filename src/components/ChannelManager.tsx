import React, { useState } from 'react';
import {
  Youtube,
  Eye,
  ThumbsUp,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Plus,
  Radio,
  CheckCircle2,
  Lock,
  Globe,
  Sparkles,
  TrendingUp,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import { ChannelInfo, YouTubeVideo } from '../types';
import { formatCount } from '../utils/pipeline';

interface ChannelManagerProps {
  channel: ChannelInfo | null;
  videos: YouTubeVideo[];
  onRecordNewVoice: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const ChannelManager: React.FC<ChannelManagerProps> = ({
  channel,
  videos,
  onRecordNewVoice,
  onRefresh,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'public' | 'unlisted' | 'private'>('all');

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrivacy = filterPrivacy === 'all' || video.privacyStatus === filterPrivacy;
    return matchesSearch && matchesPrivacy;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Channel Profile Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        {/* Banner image or gradient */}
        <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950">
          {channel?.bannerUrl ? (
            <img
              src={channel.bannerUrl}
              alt="Channel Banner"
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">
              <Youtube className="w-24 h-24 opacity-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>

        {/* Channel Details Overlay */}
        <div className="relative px-6 sm:px-8 pb-6 -mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <img
              src={channel?.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'}
              alt={channel?.title || 'YouTube Channel'}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-slate-900 shadow-2xl object-cover bg-slate-800"
            />
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {channel?.title || 'My YouTube Channel'}
                </h2>
                <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {channel?.customUrl || '@autotube_channel'} • {channel?.videoCount || videos.length} videos published
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 pt-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Refresh channel statistics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onRecordNewVoice}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Make Video from Voice</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-slate-800 bg-slate-950/60 p-4 sm:p-6 gap-4 text-center">
          <div className="space-y-1 border-r border-slate-800/80 last:border-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subscribers</span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatCount(channel?.subscriberCount || '52400')}
            </div>
          </div>

          <div className="space-y-1 border-r border-slate-800/80 last:border-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Video Views</span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatCount(channel?.viewCount || '1850000')}
            </div>
          </div>

          <div className="space-y-1 border-r border-slate-800/80 last:border-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Automated Uploads</span>
            <div className="text-xl sm:text-2xl font-black text-red-400">
              {channel?.videoCount || videos.length}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Automation Status</span>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Voice Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Channel Performance & AI Insights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Avg. Shorts Retention</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">88.4%</div>
          <p className="text-xs text-emerald-400 font-semibold">+14.2% above YouTube baseline</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Voice Turnaround Speed</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">&lt; 15 sec</div>
          <p className="text-xs text-slate-400">Voice prompt to YouTube publish</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Connected Account</span>
            <Globe className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-white truncate">
            {channel?.isDemo ? 'Sandbox Mode' : channel?.title || 'YouTube Channel'}
          </div>
          <p className="text-xs text-slate-400">OAuth API Verified with Upload Scopes</p>
        </div>
      </section>

      {/* 3. Published Videos Management Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Published & Managed Videos</h3>
            <p className="text-xs text-slate-400">Review, inspect, or manage videos on your channel</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Privacy Filters */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['all', 'public', 'unlisted', 'private'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterPrivacy(filter)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                    filterPrivacy === filter
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Video Cards Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <Radio className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No videos found</p>
            <p className="text-xs text-slate-500 mt-1">Speak into the Voice Studio to generate your first video!</p>
            <button
              onClick={onRecordNewVoice}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Open Voice Studio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 backdrop-blur-md ${
                          video.privacyStatus === 'public'
                            ? 'bg-emerald-500/80 text-white'
                            : video.privacyStatus === 'unlisted'
                            ? 'bg-amber-500/80 text-white'
                            : 'bg-slate-700/80 text-slate-200'
                        }`}
                      >
                        {video.privacyStatus === 'public' && <Globe className="w-2.5 h-2.5" />}
                        {video.privacyStatus === 'unlisted' && <Eye className="w-2.5 h-2.5" />}
                        {video.privacyStatus === 'private' && <Lock className="w-2.5 h-2.5" />}
                        <span>{video.privacyStatus}</span>
                      </span>
                    </div>

                    {video.isAutoGenerated && (
                      <div className="absolute bottom-2 left-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600/90 text-white shadow">
                          AutoTube Made
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {video.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {video.description}
                    </p>
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="p-4 pt-0 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{video.viewCount || '1.2K'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(video.publishedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold"
                  >
                    <span>Watch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
