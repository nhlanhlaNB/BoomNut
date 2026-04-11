'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseAppUsageReturn {
  usageCount: number;
  remainingCount: number;
  isLimitExceeded: boolean;
  trackUsage: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
  resetUsage: () => void;
}

/**
 * Hook for tracking app usage with persistence to Firebase
 * Usage is tracked daily and persists across page refreshes
 * 
 * @param appName - Name of the app (e.g., 'tutor', 'arcade', 'essay-grading')
 * @param freeLimit - Free tier usage limit (default: 2)
 * @returns Usage tracking state and methods
 */
export function useAppUsage(appName: string, freeLimit: number = 2): UseAppUsageReturn {
  const { user } = useAuth();
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load usage count from Firebase on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/usage/track?userId=${user.uid}&appName=${appName}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch usage: ${response.statusText}`);
        }

        const data = await response.json();
        setUsageCount(data.messageCount || 0);
        console.log(`[useAppUsage] Loaded ${appName} usage:`, data.messageCount);
      } catch (err) {
        console.error(`[useAppUsage] Error loading usage for ${appName}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load usage');
        // Don't block the UI if usage loading fails
        setUsageCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [user, appName]);

  // Track usage when an action is performed
  const trackUsage = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.warn('[useAppUsage] No user logged in');
      return false;
    }

    try {
      const response = await fetch('/api/usage/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          appName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to track usage: ${response.statusText}`);
      }

      const data = await response.json();
      const newCount = data.messageCount || usageCount + 1;
      setUsageCount(newCount);
      
      console.log(`[useAppUsage] Tracked ${appName} usage, new count:`, newCount);
      return true;
    } catch (err) {
      console.error(`[useAppUsage] Error tracking usage for ${appName}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to track usage');
      return false;
    }
  }, [user, appName, usageCount]);

  // Manual reset (admin only - for testing)
  const resetUsage = useCallback(async () => {
    if (!user) return;
    
    try {
      // This would need a separate admin endpoint to reset usage
      console.log('[useAppUsage] Reset requested for:', appName);
      setUsageCount(0);
    } catch (err) {
      console.error('[useAppUsage] Error resetting usage:', err);
    }
  }, [user, appName]);

  return {
    usageCount,
    remainingCount: Math.max(0, freeLimit - usageCount),
    isLimitExceeded: usageCount >= freeLimit,
    trackUsage,
    loading,
    error,
    resetUsage,
  };
}
