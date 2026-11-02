import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProductReviews, useInvalidateReviews } from '@/hooks/useReviews';
import StarRating from '@/components/StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { useTx } from '@/lib/i18n';

const ReviewsSection: React.FC<{ productId: string }> = ({ productId }) => {
  const tx = useTx();
  const { user } = useAuth();
  const { data: reviews, isLoading } = useProductReviews(productId);
  const invalidate = useInvalidateReviews();
  const mine = reviews?.find((r) => r.user_id === user?.id);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (rating < 1) { setError(tx({ ar: 'اختر عدد النجوم', he: 'בחרו דירוג', en: 'Please choose a rating' })); return; }
    setError(''); setSaving(true);
    // Never derive a public name from email/phone.
    const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
    const name = prof?.full_name?.trim() || tx({ ar: 'زبون', he: 'לקוח', en: 'Customer' });
    const { error: err } = await supabase.from('product_reviews').upsert(
      { product_id: productId, user_id: user.id, rating, comment: comment.trim().slice(0, 1000) || null, reviewer_name: name },
      { onConflict: 'product_id,user_id' }
    );
    setSaving(false);
    if (err) { toast.error(err.message); return; }
    toast.success(tx({ ar: 'شكرًا على تقييمك!', he: 'תודה על הדירוג!', en: 'Thanks for your review!' }));
    setRating(0); setComment('');
    invalidate(productId);
  };

  return (
    <div className="flex flex-col gap-[16px]">
      {isLoading ? (
        [0, 1].map((i) => <Skeleton key={i} className="h-[64px] rounded-[12px]" />)
      ) : reviews?.length ? (
        reviews.map((r) => (
          <div key={r.id} className="border-b border-outline-variant/50 pb-[12px] last:border-0">
            <div className="flex items-center justify-between mb-[4px]">
              <span className="text-[14px] font-bold">{r.reviewer_name || tx({ ar: 'زبون', he: 'לקוח', en: 'Customer' })}</span>
              <StarRating value={r.rating} size={12} />
            </div>
            {r.comment && <p className="text-[14px] text-muted-foreground leading-relaxed">{r.comment}</p>}
          </div>
        ))
      ) : (
        <p className="text-[14px] text-muted-foreground">{tx({ ar: 'كن أول من يقيّم هذا المنتج.', he: 'היו הראשונים לדרג.', en: 'Be the first to review this product.' })}</p>
      )}

      {user ? (
        <form onSubmit={submit} className="bg-surface-container rounded-[16px] p-[16px] flex flex-col gap-[10px]">
          <p className="text-[14px] font-bold">{mine ? tx({ ar: 'عدّل تقييمك', he: 'עדכנו את הדירוג', en: 'Update your review' }) : tx({ ar: 'أضف تقييمك', he: 'הוסיפו דירוג', en: 'Write a review' })}</p>
          <StarRating value={rating} onChange={setRating} size={24} />
          <textarea
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={tx({ ar: 'شاركنا رأيك…', he: 'שתפו את דעתכם…', en: 'Share your thoughts…' })}
            className="w-full rounded-[12px] border border-outline-variant bg-surface-container-lowest p-[12px] text-[14px] outline-none focus:border-primary"
          />
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <button disabled={saving} className="self-start h-[42px] px-[20px] rounded-full bg-primary text-primary-foreground text-[14px] font-bold flex items-center gap-[8px] disabled:opacity-60">
            {saving && <Loader2 className="w-[16px] h-[16px] animate-spin" />}
            {tx({ ar: 'إرسال', he: 'שליחה', en: 'Submit' })}
          </button>
        </form>
      ) : (
        <Link to="/auth" className="text-[14px] font-bold text-primary hover:underline">
          {tx({ ar: 'سجّل الدخول لكتابة تقييم', he: 'התחברו כדי לכתוב דירוג', en: 'Sign in to write a review' })}
        </Link>
      )}
    </div>
  );
};

export default ReviewsSection;
