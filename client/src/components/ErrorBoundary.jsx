import { Component } from 'react';
import i18n from '../i18n';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <h1>{i18n.t('status.error')}</h1>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
