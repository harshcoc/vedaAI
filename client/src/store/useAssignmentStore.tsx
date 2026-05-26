'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import api from '@/lib/api';
import type { Assignment, GeneratedPaper, GenerationStatus } from '@/types';

// ─── Store State & Actions ───────────────────────────────────────────

export interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  generatedPaper: GeneratedPaper | null;
  generationStatus: GenerationStatus;
  generationJobId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AssignmentActions {
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  createAssignment: (formData: FormData) => Promise<Assignment>;
  deleteAssignment: (id: string) => Promise<void>;
  triggerGeneration: (assignmentId: string) => Promise<void>;
  fetchGeneratedPaper: (assignmentId: string) => Promise<void>;
  setGenerationStatus: (status: GenerationStatus) => void;
  setGenerationJobId: (jobId: string | null) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  setGeneratedPaper: (paper: GeneratedPaper | null) => void;
  reset: () => void;
}

export type AssignmentStore = AssignmentState & AssignmentActions;

// ─── Initial State ───────────────────────────────────────────────────

const initialState: AssignmentState = {
  assignments: [],
  currentAssignment: null,
  generatedPaper: null,
  generationStatus: 'idle',
  generationJobId: null,
  isLoading: false,
  error: null,
};

// ─── Store Factory ───────────────────────────────────────────────────

export const createAssignmentStore = () =>
  createStore<AssignmentStore>((set, get) => ({
    ...initialState,

    fetchAssignments: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.get('/api/assignments');
        set({ assignments: res.data.data || res.data, isLoading: false });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch assignments';
        set({ error: message, isLoading: false });
      }
    },

    fetchAssignment: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.get(`/api/assignments/${id}`);
        const assignment = res.data.data || res.data;
        set({ currentAssignment: assignment, isLoading: false });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch assignment';
        set({ error: message, isLoading: false });
      }
    },

    createAssignment: async (formData: FormData) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.post('/api/assignments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const newAssignment = res.data.data || res.data;
        set((state) => ({
          assignments: [newAssignment, ...state.assignments],
          isLoading: false,
        }));
        return newAssignment;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create assignment';
        set({ error: message, isLoading: false });
        throw err;
      }
    },

    deleteAssignment: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await api.delete(`/api/assignments/${id}`);
        set((state) => ({
          assignments: state.assignments.filter((a) => a._id !== id),
          isLoading: false,
        }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete assignment';
        set({ error: message, isLoading: false });
      }
    },

    triggerGeneration: async (assignmentId: string) => {
      set({ generationStatus: 'queued', error: null });
      try {
        const res = await api.post(`/api/assignments/${assignmentId}/generate`);
        const jobId = res.data.jobId || res.data.data?.jobId;
        set({ generationJobId: jobId, generationStatus: 'processing' });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to trigger generation';
        set({ error: message, generationStatus: 'failed' });
      }
    },

    fetchGeneratedPaper: async (assignmentId: string) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.get(`/api/assignments/${assignmentId}/paper`);
        set({ generatedPaper: res.data.data || res.data, isLoading: false });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch generated paper';
        set({ error: message, isLoading: false });
      }
    },

    setGenerationStatus: (status: GenerationStatus) => {
      set({ generationStatus: status });
    },

    setGenerationJobId: (jobId: string | null) => {
      set({ generationJobId: jobId });
    },

    setCurrentAssignment: (assignment: Assignment | null) => {
      set({ currentAssignment: assignment });
    },

    setGeneratedPaper: (paper: GeneratedPaper | null) => {
      set({ generatedPaper: paper });
    },

    reset: () => {
      set(initialState);
    },
  }));

// ─── Context & Provider ──────────────────────────────────────────────

const AssignmentStoreContext = createContext<StoreApi<AssignmentStore> | null>(null);

export function AssignmentStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreApi<AssignmentStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createAssignmentStore();
  }

  return (
    <AssignmentStoreContext.Provider value={storeRef.current}>
      {children}
    </AssignmentStoreContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useAssignmentStore<T>(selector: (state: AssignmentStore) => T): T {
  const store = useContext(AssignmentStoreContext);
  if (!store) {
    throw new Error('useAssignmentStore must be used within AssignmentStoreProvider');
  }
  return useStore(store, selector);
}
