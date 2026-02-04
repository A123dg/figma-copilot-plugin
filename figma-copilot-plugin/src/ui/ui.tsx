import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const RELAY_URL = 'ws://127.0.0.1:8765';

function App() {
  const [status, setStatus] = React.useState('Disconnected');

  React.useEffect(() => {
    const ws = new WebSocket(RELAY_URL);

    ws.onopen = () => {
      console.log('Connected to relay');
      setStatus(`Connected → ${RELAY_URL}`);
    };
    ws.onclose = () => setStatus('Disconnected');
    ws.onerror = () => setStatus('Error (start relay server first)');

    // relay -> plugin main
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        parent.postMessage({ pluginMessage: { type: 'MCP_REQUEST', ...msg } }, '*');
      } catch {
        // ignore
      }
    };

    // plugin main -> relay
    window.onmessage = (event: MessageEvent) => {
      const m = event.data?.pluginMessage;
      if (m?.type === 'MCP_RESPONSE') {
        ws.send(JSON.stringify({ id: m.id, ok: m.ok, result: m.result, error: m.error }));
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial', padding: 12 }}>
      <div style={{ marginBottom: 6 }}>MCP Bridge</div>
      <div style={{ fontSize: 12 }}>{status}</div>
      <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
        Keep this plugin running so Copilot can scan/generate via MCP tools.
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);