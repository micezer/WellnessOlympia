'use client';

import React from 'react';

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex flex-col pb-40 relative">{children}</div>;
}
