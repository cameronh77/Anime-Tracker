import { useState } from 'react';

export default function Review({ text, spoilers }: { text: string; spoilers: boolean }) {
  const [shown, setShown] = useState(!spoilers);
  if (!shown)
    return (
      <button className="link muted small" onClick={() => setShown(true)}>
        This review contains spoilers. Show anyway
      </button>
    );
  return <p className="review">{text}</p>;
}
