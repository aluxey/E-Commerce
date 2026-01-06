import { ChevronDown } from "lucide-react";

/**
 * Accordion - Collapsible content section for mobile
 * Accessible, animated, touch-friendly
 */
export default function Accordion({ id, isOpen, onToggle, icon, title, children }) {
  const contentId = `accordion-content-${id}`;
  const headerId = `accordion-header-${id}`;

  return (
    <div className={`mh-accordion ${isOpen ? "mh-accordion--open" : ""}`}>
      <button
        id={headerId}
        className="mh-accordion__header"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="mh-accordion__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="mh-accordion__title">{title}</span>
        <ChevronDown 
          size={20} 
          className="mh-accordion__chevron" 
          aria-hidden="true"
        />
      </button>
      <div
        id={contentId}
        className="mh-accordion__content"
        role="region"
        aria-labelledby={headerId}
        hidden={!isOpen}
      >
        <div className="mh-accordion__body">
          {children}
        </div>
      </div>
    </div>
  );
}
