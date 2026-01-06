import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { toastVariants } from '../../utils/toastVariants';

const Toast = React.forwardRef(({
  className,
  variant = 'default',
  position = 'top-right',
  title,
  description,
  duration = 5000,
  closable = true,
  icon,
  onClose,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const baseClasses = 'toast';
  const variantClasses = toastVariants.variant[variant];
  const positionClasses = toastVariants.position[position];
  const visibleClasses = isVisible ? 'toast-visible' : 'toast-hidden';
  
  const classes = cn(
    baseClasses,
    variantClasses,
    positionClasses,
    visibleClasses,
    className
  );

  const renderIcon = () => {
    if (icon) return icon;
    
    const defaultIcons = {
      success: <Check size={18} />,
      error: <X size={18} />,
      warning: <AlertTriangle size={18} />,
      info: <Info size={18} />,
      default: <Info size={18} />,
    };
    
    return <span className="toast-icon">{defaultIcons[variant]}</span>;
  };

  return (
    <div className={classes} ref={ref} {...props}>
      <div className="toast-content">
        {renderIcon()}
        <div className="toast-body">
          {title && <div className="toast-title">{title}</div>}
          {description && <div className="toast-description">{description}</div>}
        </div>
        {closable && (
          <button className="toast-close" onClick={handleClose}>
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

Toast.displayName = 'Toast';

Toast.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'success', 'error', 'warning', 'info']),
  position: PropTypes.oneOf(['top-left', 'top-right', 'top-center', 'bottom-left', 'bottom-right', 'bottom-center']),
  title: PropTypes.string,
  description: PropTypes.string,
  duration: PropTypes.number,
  closable: PropTypes.bool,
  icon: PropTypes.node,
  onClose: PropTypes.func,
};

export { Toast };
export { toastVariants } from '../../utils/toastVariants';