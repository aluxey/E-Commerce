/**
 * TrustChips - Horizontal scrollable row of trust/value indicators
 * Mobile-optimized with snap scrolling
 */
export default function TrustChips({ chips }) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="mh-trust-chips" role="list" aria-label="Trust indicators">
      <div className="mh-trust-chips__track">
        {chips.map((chip, idx) => (
          <div 
            className="mh-trust-chip" 
            key={idx}
            role="listitem"
          >
            <span className="mh-trust-chip__icon" aria-hidden="true">
              {chip.icon}
            </span>
            <span className="mh-trust-chip__text">{chip.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
