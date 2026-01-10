'use client';

import React from 'react';

interface GhostTextOverlayProps {
  text?: string;
  visible?: boolean;
}

export function GhostTextOverlay({ text, visible }: GhostTextOverlayProps) {
  if (!visible || !text) return null;
  return (
    <span className="text-gray-400 opacity-50 pointer-events-none">{text}</span>
  );
}

export function InlineGhostText({ text }: { text?: string }) {
  if (!text) return null;
  return <span className="text-gray-400 opacity-50">{text}</span>;
}

export function StreamingGhostText({ text }: { text?: string }) {
  if (!text) return null;
  return <span className="text-gray-400 opacity-50 animate-pulse">{text}</span>;
}

export default GhostTextOverlay;
