import { useState } from 'react';

interface Props {
  value: number | null;
  onChange?: (v: number | null) => void;
  size?: number;
}

/** Five stars with half-star precision. Click the current value again to clear. */
export default function StarRating({ value, onChange, size = 22 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const readOnly = !onChange;

  return (
    <div
      className="stars"
      style={{ fontSize: size }}
      onMouseLeave={() => setHover(null)}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={value ? `${value} out of 5 stars` : 'Not rated'}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = shown >= i ? 100 : shown >= i - 0.5 ? 50 : 0;
        return (
          <span key={i} className="star">
            <span className="star-bg">★</span>
            <span className="star-fg" style={{ width: `${fill}%` }}>★</span>
            {!readOnly &&
              [i - 0.5, i].map((v, half) => (
                <button
                  key={v}
                  type="button"
                  className={`star-hit ${half ? 'right' : 'left'}`}
                  aria-label={`${v} stars`}
                  onMouseEnter={() => setHover(v)}
                  onClick={() => onChange(value === v ? null : v)}
                />
              ))}
          </span>
        );
      })}
    </div>
  );
}
