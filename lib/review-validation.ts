import type { CustomerReview } from "@/lib/reviews";

export function validateReview(review: Partial<CustomerReview>) {
  if (!review.name?.trim() || !review.quote?.trim()) return "Customer name and review text are required.";
  if (!Number.isInteger(review.rating) || Number(review.rating) < 1 || Number(review.rating) > 5) return "Rating must be from 1 to 5 stars.";
  return null;
}
