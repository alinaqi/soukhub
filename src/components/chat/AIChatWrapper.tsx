'use client';

import { AIChatWidget } from './AIChatWidget';

interface AIChatWrapperProps {
  userId: string;
}

export function AIChatWrapper({ userId }: AIChatWrapperProps) {
  return <AIChatWidget userId={userId} />;
}
