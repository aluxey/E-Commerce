import ReactDOM from 'react-dom';

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="dialog-overlay">
      <div className="dialog-content">
        <button className="dialog-close" onClick={() => onOpenChange(false)}>&times;</button>
        {children}
      </div>
    </div>,
    document.body
  );
};

export const DialogContent = ({ children }) => <div className="dialog-body">{children}</div>;
export const DialogHeader = ({ children }) => <div className="dialog-header">{children}</div>;
export const DialogTitle = ({ children }) => <h2 className="dialog-title">{children}</h2>;
