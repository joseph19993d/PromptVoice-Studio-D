import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20, color: 'white', background: 'red', position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto', fontFamily: 'monospace'}}>
        <h1>React App Crashed 💥</h1>
        <pre style={{whiteSpace: 'pre-wrap'}}>{this.state.error?.toString()}</pre>
        <pre style={{whiteSpace: 'pre-wrap', marginTop: 20}}>{this.state.error?.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
