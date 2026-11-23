import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Flag,
  Globe,
  MessageSquareReply,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { ReviewItem } from '../../types/api';
import { ScoreBadge, SentimentBadge, TOPIC_DISPLAY_NAMES, TopicPill } from '../ui/Badges';

interface ReviewDetailDrawerProps {
  review: ReviewItem | null;
  onClose: () => void;
  onReviewUpdated?: (updated: ReviewItem) => void;
}

export function ReviewDetailDrawer({
  review,
  onClose,
  onReviewUpdated,
}: ReviewDetailDrawerProps): React.JSX.Element {
  const [notes, setNotes] = useState('');
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setNotes(review?.resolvedNotes || '');
  }, [review]);

  const resolveMutation = useMutation({
    mutationFn: (payload: { id: string; resolved: boolean; resolvedNotes: string | null }) =>
      api.resolveReview(payload.id, {
        resolved: payload.resolved,
        resolvedNotes: payload.resolvedNotes,
      }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['flagged-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['overview'] });
      onReviewUpdated?.(updated);
      showToast({
        title: updated.isResolved ? 'Review marked as resolved' : 'Review reopened',
        description: `${updated.reviewerName} (${updated.propertyName})`,
        variant: 'success',
      });
    },
    onError: (err: Error) => {
      showToast({
        title: 'Failed to update review status',
        description: err.message,
        variant: 'error',
      });
    },
  });

  return (
    <Dialog.Root open={Boolean(review)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-border bg-surface shadow-elevated focus:outline-none"
        >
          {review && (
            <>
              <div className="flex items-start justify-between border-b border-border px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={review.score} size="lg" />
                    <SentimentBadge sentiment={review.sentiment} />
                    {review.isFlagged && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          review.isResolved
                            ? 'bg-sentiment-pos-bg text-sentiment-pos'
                            : 'bg-sentiment-neg-bg text-sentiment-neg'
                        }`}
                      >
                        <Flag className="h-3 w-3" />
                        {review.isResolved ? 'Flagged • Resolved' : 'Flagged • Needs Action'}
                      </span>
                    )}
                  </div>
                  <Dialog.Title className="mt-2 text-base font-semibold text-content-primary">
                    {review.title}
                  </Dialog.Title>
                </div>

                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close review drawer"
                    className="rounded-md p-1.5 text-content-muted hover:bg-subtle hover:text-content-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Guest & Stay Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-subtle/50 p-4 text-xs">
                  <div className="flex items-center gap-2 text-content-secondary">
                    <Building2 className="h-4 w-4 text-content-muted shrink-0" />
                    <div>
                      <p className="text-content-muted">Property</p>
                      <p className="font-medium text-content-primary">{review.propertyName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-content-secondary">
                    <User className="h-4 w-4 text-content-muted shrink-0" />
                    <div>
                      <p className="text-content-muted">Guest</p>
                      <p className="font-medium text-content-primary">
                        {review.reviewerName} ({review.tripType})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-content-secondary">
                    <Globe className="h-4 w-4 text-content-muted shrink-0" />
                    <div>
                      <p className="text-content-muted">Country</p>
                      <p className="font-medium text-content-primary">
                        {review.guestCountryName} ({review.guestCountryCode})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-content-secondary">
                    <Calendar className="h-4 w-4 text-content-muted shrink-0" />
                    <div>
                      <p className="text-content-muted">Review Date & Stay</p>
                      <p className="font-medium text-content-primary tabular-nums">
                        {review.reviewDate} • {review.stayNights}n
                        {review.roomType ? ` (${review.roomType})` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Positive & Negative Comments */}
                <div className="space-y-3">
                  {review.positiveComment && (
                    <div className="rounded-lg border border-sentiment-pos/25 bg-sentiment-pos-bg/60 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-sentiment-pos">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        What the guest liked
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-content-primary">
                        {review.positiveComment}
                      </p>
                    </div>
                  )}

                  {review.negativeComment && (
                    <div className="rounded-lg border border-sentiment-neg/25 bg-sentiment-neg-bg/60 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-sentiment-neg">
                        <ThumbsDown className="h-3.5 w-3.5" />
                        Areas for improvement
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-content-primary">
                        {review.negativeComment}
                      </p>
                    </div>
                  )}

                  {!review.positiveComment && !review.negativeComment && (
                    <div className="rounded-lg border border-border bg-surface p-4">
                      <p className="text-sm leading-relaxed text-content-primary">
                        {review.fullText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Rule-Based Topic Breakdown */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                    Detected Topics & Evidence ({review.topics.length})
                  </h4>
                  {review.topics.length === 0 ? (
                    <p className="mt-2 text-xs text-content-muted">
                      No specific operational topic keywords matched in this review.
                    </p>
                  ) : (
                    <div className="mt-2.5 space-y-2.5">
                      {review.topics.map((t) => (
                        <div
                          key={t.topic}
                          className="rounded-md border border-border bg-subtle/40 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <TopicPill topic={t.topic} sentiment={t.sentiment} />
                            <span className="font-mono text-[11px] text-content-muted">
                              Keywords: {t.matchedKeywords.join(', ')}
                            </span>
                          </div>
                          {t.snippet && (
                            <p className="mt-2 text-content-secondary italic">
                              “{t.snippet}”
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Owner Response */}
                {review.ownerResponse && (
                  <div className="rounded-lg border border-border bg-subtle p-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-content-primary">
                        <MessageSquareReply className="h-3.5 w-3.5 text-brand" />
                        Property Management Response
                      </span>
                      {review.ownerRespondedAt && (
                        <span className="text-content-muted tabular-nums">
                          {review.ownerRespondedAt.slice(0, 10)}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-content-secondary">
                      {review.ownerResponse}
                    </p>
                  </div>
                )}

                {/* Flagged Resolution Workflow */}
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                      Service Recovery & Resolution
                    </h4>
                    {review.isResolved && review.resolvedAt && (
                      <span className="inline-flex items-center gap-1 text-xs text-sentiment-pos">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolved {review.resolvedAt.slice(0, 10)}
                      </span>
                    )}
                  </div>

                  <label
                    htmlFor="resolution-notes"
                    className="mt-3 block text-xs font-medium text-content-secondary"
                  >
                    Internal Resolution Notes
                  </label>
                  <textarea
                    id="resolution-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add action taken (e.g., contacted guest, inspected room HVAC)..."
                    className="mt-1.5 w-full rounded-md border border-border bg-canvas px-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:border-brand focus:outline-none"
                  />

                  <div className="mt-3 flex items-center justify-end gap-2">
                    {review.isResolved ? (
                      <button
                        type="button"
                        disabled={resolveMutation.isPending}
                        onClick={() =>
                          resolveMutation.mutate({
                            id: review.id,
                            resolved: false,
                            resolvedNotes: null,
                          })
                        }
                        className="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-content-primary hover:bg-subtle disabled:opacity-50"
                      >
                        Reopen Issue
                      </button>
                    ) : null}

                    <button
                      type="button"
                      disabled={resolveMutation.isPending}
                      onClick={() =>
                        resolveMutation.mutate({
                          id: review.id,
                          resolved: true,
                          resolvedNotes: notes.trim() || null,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {review.isResolved ? 'Update Resolution Notes' : 'Mark as Resolved'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export { TOPIC_DISPLAY_NAMES };
