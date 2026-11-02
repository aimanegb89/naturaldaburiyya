import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export type RatingSummary = Record<string, { avg: number; count: number }>;

export function useRatingSummary() {
  return useQuery({
    queryKey: ['rating-summary'],
    staleTime: 60_000,
    queryFn: async (): Promise<RatingSummary> => {
      const { data, error } = await supabase.from('product_reviews').select('product_id, rating');
      if (error) throw error;
      const acc: Record<string, { sum: number; count: number }> = {};
      for (const r of data ?? []) {
        acc[r.product_id] ??= { sum: 0, count: 0 };
        acc[r.product_id].sum += r.rating;
        acc[r.product_id].count += 1;
      }
      return Object.fromEntries(
        Object.entries(acc).map(([k, v]) => [k, { avg: v.sum / v.count, count: v.count }])
      );
    },
  });
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}

export function useInvalidateReviews() {
  const qc = useQueryClient();
  return (productId: string) => {
    qc.invalidateQueries({ queryKey: ['reviews', productId] });
    qc.invalidateQueries({ queryKey: ['rating-summary'] });
  };
}
