import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { PerfMonitorService } from './services/PerfMonitorService';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found in document');

PerfMonitorService.markStartup('root_ready');
PerfMonitorService.markStartup('render_start');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

requestAnimationFrame(() => {
  PerfMonitorService.markStartup('first_frame');
  PerfMonitorService.measureStartup('render_to_first_frame_ms', 'render_start', 'first_frame');
});
