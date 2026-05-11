'use client';

import { useAuth } from '@/components/AuthProvider';
import { LandingPage } from '@/components/LandingPage';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FDFBF7]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FFAE42] border-t-transparent" />
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
}
