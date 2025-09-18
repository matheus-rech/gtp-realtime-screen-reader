'use client';

import { motion } from 'framer-motion';
import type { AssistantMode } from '@/types/realtime';

type VideoPreviewProps = {
  mode: AssistantMode;
  previewFrame: string | null;
};

const VideoPreview = ({ mode, previewFrame }: VideoPreviewProps) => {
  return (
    <motion.div
      className="relative h-64 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 shadow-lg"
      animate={{ boxShadow: previewFrame ? '0 0 25px rgba(56, 189, 248, 0.45)' : '0 0 0 rgba(0,0,0,0)' }}
      transition={{ duration: 0.6 }}
    >
      {previewFrame ? (
        <img
          src={`data:image/jpeg;base64,${previewFrame}`}
          alt={`Live ${mode} feed`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          Awaiting {mode} feed...
        </div>
      )}
      <div className="absolute bottom-3 left-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-widest text-slate-200">
        {mode} mode
      </div>
    </motion.div>
  );
};

export default VideoPreview;
