'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAssignmentStore } from '@/store/useAssignmentStore';

export function useSocket() {
  const { getToken } = useAuth();
  const setGenerationStatus = useAssignmentStore((s) => s.setGenerationStatus);
  const fetchGeneratedPaper = useAssignmentStore((s) => s.fetchGeneratedPaper);
  const fetchAssignment = useAssignmentStore((s) => s.fetchAssignment);
  const connectedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Only connect once
    if (connectedRef.current) return;
    connectedRef.current = true;

    const connect = async () => {
      try {
        const token = await getToken();
        if (!mountedRef.current) return;

        const socket = getSocket(token || undefined);

        socket.on('connect', () => {
          console.log('🔌 Socket connected');
        });

        socket.on('generation:status', (data: { assignmentId: string; status: string }) => {
          if (!mountedRef.current) return;
          console.log('📡 Generation status:', data);
          setGenerationStatus(data.status as 'processing' | 'queued');
        });

        socket.on('generation:complete', (data: { assignmentId: string; paperId: string }) => {
          if (!mountedRef.current) return;
          console.log('✅ Generation complete:', data);
          setGenerationStatus('completed');
          fetchGeneratedPaper(data.assignmentId);
          fetchAssignment(data.assignmentId);
        });

        socket.on('generation:failed', (data: { assignmentId: string; error: string }) => {
          if (!mountedRef.current) return;
          console.log('❌ Generation failed:', data);
          setGenerationStatus('failed');
          fetchAssignment(data.assignmentId);
        });

        socket.on('disconnect', () => {
          console.log('🔌 Socket disconnected');
        });

        socket.on('connect_error', (err: Error) => {
          console.warn('🔌 Socket connection error (server may be offline):', err.message);
        });

        socket.connect();
      } catch (err) {
        console.warn('Socket setup error:', err);
      }
    };

    connect();

    return () => {
      mountedRef.current = false;
      disconnectSocket();
      connectedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount
}
