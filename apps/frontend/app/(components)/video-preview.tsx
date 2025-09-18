'use client';

import { useEffect, useRef } from 'react';
import type { CaptureMode } from '../lib/types';
import { Card } from '../../components/ui/card';

interface Props {
  screenStream?: MediaStream | null;
  cameraStream?: MediaStream | null;
  mode: CaptureMode;
}

export function VideoPreview({ screenStream, cameraStream, mode }: Props) {
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const cameraRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = screenRef.current;
    if (video && screenStream) {
      video.srcObject = screenStream;
      void video.play().catch(() => undefined);
    }
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [screenStream]);

  useEffect(() => {
    const video = cameraRef.current;
    if (video && cameraStream) {
      video.srcObject = cameraStream;
      void video.play().catch(() => undefined);
    }
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [cameraStream]);

  const showCamera = mode !== 'screen' && cameraStream;
  const showScreen = mode !== 'camera' && screenStream;

  return (
    <Card className="flex h-64 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between text-sm text-white/80">
        <span>Live visual context</span>
        <span className="text-xs uppercase tracking-wide text-white/60">{mode} mode</span>
      </div>
      <div className="flex h-full gap-4">
        {showScreen ? (
          <video ref={screenRef} className="size-full rounded-xl object-cover" muted playsInline />
        ) : (
          <div className="flex size-full items-center justify-center rounded-xl border border-dashed border-white/10 text-white/40">
            Screen feed inactive
          </div>
        )}
        {mode === 'hybrid' || mode === 'camera' ? (
          showCamera ? (
            <video ref={cameraRef} className="h-full w-48 rounded-xl object-cover" muted playsInline />
          ) : (
            <div className="hidden h-full w-48 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-white/40 md:flex">
              Camera feed inactive
            </div>
          )
        ) : null}
      </div>
    </Card>
  );
}
