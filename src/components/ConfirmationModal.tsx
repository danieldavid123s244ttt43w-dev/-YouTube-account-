import React from 'react';
import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  channelName: string;
  privacy: 'public' | 'unlisted' | 'private';
  onConfirm: () => void;
  onCancel: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  channelName,
  privacy,
  onConfirm,
  onCancel,
  isUploading = false,
  uploadProgress = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        {!isUploading && (
          <button
            onClick={onCancel}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Publish Video to YouTube</h3>
            <p className="text-sm text-slate-400">Confirm upload to your connected channel</p>
          </div>
        </div>

        <div className="space-y-4 my-6">
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>TARGET CHANNEL</span>
              <span className="font-semibold text-white px-2 py-0.5 bg-slate-800 rounded">
                {channelName}
              </span>
            </div>
            <div className="text-sm font-semibold text-white truncate">
              "{title}"
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-800">
              <span>PRIVACY VISIBILITY</span>
              <span className="uppercase text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                {privacy}
              </span>
            </div>
          </div>

          {isUploading ? (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-indigo-400 animate-pulse">Uploading to YouTube Data API...</span>
                <span className="text-white font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 to-indigo-600 h-3 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 text-center">
                Please keep this window open while the video file is processed by YouTube servers.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-slate-400 bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                By publishing, this video will become active on your YouTube channel according to the selected privacy level. You can update or remove it anytime in YouTube Studio.
              </span>
            </div>
          )}
        </div>

        {!isUploading && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-600/30 transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              Confirm & Publish Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
