import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const modalVariants = {
  size: {
    xs: 'modal-xs',
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    xl: 'modal-xl',
    full: 'modal-full',
  },
  position: {
    center: 'modal-center',
    top: 'modal-top',
    bottom: 'modal-bottom',
  },
};

const Modal = React.forwardRef(({
  className,
  isOpen = false,
  onClose,
  size = 'md',
  position = 'center',
  closable = true,
  closeOnOverlayClick = true,
  title,
  description,
  children,
  ...props
}, ref) => {
  const modalRef = React.useRef(null);
  const overlayRef = React.useRef(null);

  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen && closable) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closable, onClose]);

  const handleOverlayClick = (event) => {
    if (event.target === overlayRef.current && closeOnOverlayClick && closable) {
      onClose();
    }
  };

  const handleClose = () => {
    if (closable) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const baseClasses = 'modal';
  const sizeClasses = modalVariants.size[size];
  const positionClasses = modalVariants.position[position];
  
  const classes = cn(
    baseClasses,
    sizeClasses,
    positionClasses,
    className
  );

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className={classes} ref={modalRef} {...props}>
        {(title || closable) && (
          <div className="modal-header">
            <div className="modal-header-content">
              {title && <h3 className="modal-title">{title}</h3>}
              {description && <p className="modal-description">{description}</p>}
            </div>
            {closable && (
              <button className="modal-close" onClick={handleClose}>
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

Modal.propTypes = {
  className: PropTypes.string,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', 'full']),
  position: PropTypes.oneOf(['center', 'top', 'bottom']),
  closable: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
};

export { Modal, modalVariants };