'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseAppUsageReturn {
  usageCount: number;
  remainingCount: number;
  isLimitExceeded: boolean;
  trackUsage: () => Promise<boolean>;
  isLoaded: boolean;
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load usage count from Firebase on mount
  useEffect(() => {
    if (!user) {
      setIsLoaded(true);
      return;
    }

    const loadUsage = async () => {
      try {
        setError(null);
        
        // Get token for authentication
        const idToken = await user.getIdToken();
        
        const response = await fetch(`/api/usage/track?userId=${user.uid}&appName=${appName}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch usage: ${response.statusText}`);
        }

        const data = await response.json();
        const count = data.messageCount || data.count || 0;
        setUsageCount(typeof count === 'number' ? count : 0);
        console.log(`[useAppUsage] ✓ Loaded ${appName} usage: ${count}`);
      } catch (err) {
        console.error(`[useAppUsage] ✗ Error loading usage for ${appName}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load usage');
        setUsageCount(0);
      } finally {
        setIsLoaded(true);
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
      // Get the ID token for authentication
      const idToken = await user.getIdToken();
      console.log(`[useAppUsage] Tracking ${appName} for ${user.uid} with token`);

      const response = await fetch('/api/usage/track', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userId: user.uid,
          appName,
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to track usage: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if Firebase rules are blocking writes
      if (data.rulesCheckNeeded) {
        console.error(`[useAppUsage] ❌ FIREBASE RULES ISSUE DETECTED!`);
        console.error(`[useAppUsage] Your Firebase Realtime Database rules don't allow writes to 'dailyUsage' path`);
        console.error(`[useAppUsage] ⚠️ FIX: Update rules using FIREBASE_RTDB_RULES_WITH_DAILY_USAGE.json`);
        console.error(`[useAppUsage] 📍 Go to: Firebase Console → Realtime Database → Rules`);
      }
      
      // Get new count from server (should be incremented)
      const newCount = typeof data.messageCount === 'number' ? data.messageCount : usageCount + 1;
      
      // Only update if successful write to Firebase
      if (data.success === true) {
        setUsageCount(newCount);
        console.log(`[useAppUsage] ✓ Tracked ${appName} usage → ${newCount}/${freeLimit}`);
      } else if (data.success === false) {
        // Write failed, but we still update local state for UX
        // Next load will get correct value from Firebase
        setUsageCount(newCount);
        console.warn(`[useAppUsage] ⚠️ Tracked ${appName} locally (not persisted): ${newCount}/${freeLimit}`);
        console.warn(`[useAppUsage] If this persists, check Firebase rules: ${data.error}`);
      }
      
      return data.success !== false;
    } catch (err) {
      console.error(`[useAppUsage] ✗ Error tracking usage for ${appName}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to track usage');
      return false;
    }
  }, [user, appName, usageCount, freeLimit]);

  // Manual reset (admin only - for testing)
  const resetUsage = useCallback(async () => {
    if (!user) return;
    
    try {
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
    isLoaded,
    error,
    resetUsage,
  };
}
