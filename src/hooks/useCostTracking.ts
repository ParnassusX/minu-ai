import { useState, useEffect, useCallback } from "react";
import { clientCostTrackingService } from "@/lib/services/cost-tracking-client";
import { CostRecord } from "@/types/cost-tracking";

interface CostSummary {
  totalCost: number;
  byProvider: Record<string, number>;
  byType: Record<string, number>;
}

interface SpendingAnalytics {
  dailySpending: Array<{ date: string; amount: number; count: number }>;
  modelBreakdown: Array<{ model: string; cost: number; count: number }>;
  providerBreakdown: Array<{ provider: string; cost: number; count: number }>;
  totalSpent: number;
  averageCostPerGeneration: number;
}

interface SpendingLimits {
  dailyLimit: { current: number; limit: number; exceeded: boolean };
  monthlyLimit: { current: number; limit: number; exceeded: boolean };
  warnings: string[];
}

export function useCostTracking() {
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [analytics, setAnalytics] = useState<SpendingAnalytics | null>(null);
  const [limits, setLimits] = useState<SpendingLimits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientCostTrackingService.getUserCostRecords();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch records");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientCostTrackingService.getUserCostSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (days: number = 30) => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientCostTrackingService.getSpendingAnalytics(days);
      setAnalytics(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch analytics"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLimits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientCostTrackingService.checkSpendingLimits();
      setLimits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch limits");
    } finally {
      setLoading(false);
    }
  }, []);

  const estimateCost = useCallback(
    (
      model: string,
      parameters: Record<string, any>,
      generationType: "image" | "video" | "enhancement" = "image"
    ) => {
      return clientCostTrackingService.estimateGenerationCost(
        model,
        parameters,
        generationType
      );
    },
    []
  );

  const reconcileCosts = useCallback(
    async (timeRange?: { start: Date; end: Date }) => {
      try {
        setLoading(true);
        setError(null);
        const result = await clientCostTrackingService.reconcileCosts(
          timeRange
        );
        // Refresh data after reconciliation
        await Promise.all([fetchRecords(), fetchSummary(), fetchAnalytics()]);
        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reconcile costs"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchRecords, fetchSummary, fetchAnalytics]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchRecords(),
      fetchSummary(),
      fetchAnalytics(),
      fetchLimits(),
    ]);
  }, [fetchRecords, fetchSummary, fetchAnalytics, fetchLimits]);

  return {
    // Data
    records,
    summary,
    analytics,
    limits,

    // State
    loading,
    error,

    // Actions
    fetchRecords,
    fetchSummary,
    fetchAnalytics,
    fetchLimits,
    estimateCost,
    reconcileCosts,
    refreshAll,

    // Utilities
    clearError: () => setError(null),
  };
}

export default useCostTracking;
