'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface CreditInfo {
  plan: string;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
}

export const CreditsCounter = () => {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<CreditInfo | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch('/api/listings/credits', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: CreditInfo) => setCredits(data))
      .catch(console.error);
  }, [session?.user?.id]);

  if (!session || !credits) return null;

  const isAdmin = (session?.user as any)?.role === 'admin';
  const isUnlimited = credits.plan === 'unlimited' || isAdmin;
  const pct = isUnlimited ? 100 : (credits.credits_remaining / credits.credits_total) * 100;
  const isLow = !isUnlimited && pct <= 30;
  const isEmpty = !isUnlimited && credits.credits_remaining <= 0;

  const colorClass = isEmpty
    ? 'bg-secondary/10 text-secondary border-secondary/30'
    : isLow
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-primary/8 text-primary border-primary/20';

  return (
    <Link
      href="/dashboard/ai-listing"
      title="Ir al generador de listados con IA"
      className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all hover:shadow-sm ${colorClass}`}
    >
      <span>✨</span>
      <span>
        {isUnlimited
          ? '∞ créditos'
          : `${credits.credits_used}/${credits.credits_total}`}
      </span>
    </Link>
  );
};
