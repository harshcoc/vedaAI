'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AssignmentStoreProvider } from '@/store/useAssignmentStore';
import { setAuthToken } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import Spinner from '@/components/ui/Spinner';
import './dashboard-layout.css';

function AuthTokenSync({ onReady }: { onReady: () => void }) {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    let mounted = true;
    const syncToken = async () => {
      try {
        const token = await getToken();
        if (mounted) {
          setAuthToken(token);
          onReady();
        }
      } catch (err) {
        console.warn('Failed to get auth token:', err);
        if (mounted) onReady(); // Still signal ready to avoid hanging
      }
    };

    syncToken();
    // Refresh token every 50 seconds
    const interval = setInterval(syncToken, 50000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  return null;
}

function SocketConnector() {
  useSocket();
  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tokenReady, setTokenReady] = useState(false);

  return (
    <AssignmentStoreProvider>
      <AuthTokenSync onReady={() => setTokenReady(true)} />
      {tokenReady && <SocketConnector />}
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard__main">
          <TopBar />
          <main className="dashboard__content">
            {tokenReady ? children : <Spinner size="lg" text="Loading..." />}
          </main>
        </div>
        <MobileNav />
      </div>
    </AssignmentStoreProvider>
  );
}
