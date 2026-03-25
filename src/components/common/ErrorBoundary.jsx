import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('React error boundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', background: '#fff1f2', minHeight: '100vh' }}>
          <h2 style={{ color: '#b91c1c', marginBottom: '12px' }}>Something went wrong</h2>
          <pre style={{ background: '#fee2e2', padding: '16px', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '13px', color: '#7f1d1d' }}>
            {this.state.error.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px', padding: '8px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
