import { useState } from 'react';
import { Button, RatingStars, Textarea } from '@/components/ui';

export interface FeedbackValues {
  foodRating: number;
  serviceRating: number;
  experienceRating: number;
  comment: string;
}

/** Feature 11 — Customer feedback: food, service, experience ratings + comment. */
export function FeedbackForm({ onSubmit }: { onSubmit: (v: FeedbackValues) => void }) {
  const [food, setFood] = useState(0);
  const [service, setService] = useState(0);
  const [experience, setExperience] = useState(0);
  const [comment, setComment] = useState('');

  const ready = food > 0 && service > 0 && experience > 0;

  return (
    <div className="space-y-4">
      <RatingRow label="Food" value={food} onChange={setFood} />
      <RatingRow label="Service" value={service} onChange={setService} />
      <RatingRow label="Overall experience" value={experience} onChange={setExperience} />
      <Textarea
        label="Anything else? (optional)"
        placeholder="Tell us what you loved or how we can improve…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button
        fullWidth
        size="lg"
        disabled={!ready}
        onClick={() => onSubmit({ foodRating: food, serviceRating: service, experienceRating: experience, comment })}
      >
        Submit feedback
      </Button>
    </div>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      <RatingStars value={value} onChange={onChange} size={28} />
    </div>
  );
}
