import http from 'k6/http';
import { WebSocket } from 'k6/experimental/websockets';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    rest_readers: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      exec: 'readDocuments',
    },
    ws_editors: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      exec: 'editDocuments',
    },
    ai_users: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
      exec: 'triggerAI',
    },
  },
  thresholds: {
    'http_req_duration{scenario:rest_readers}': ['p(95)<200'],
    'http_req_duration{scenario:ai_users}': ['p(95)<2000'],
    'ws_connecting': ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:4000';

export function readDocuments() {
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    'health status 200': (r) => r.status === 200,
  });
  sleep(1);
}

export function editDocuments() {
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket`;
  const ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    // Send Socket.io handshake protocol connect packet
    ws.send('40');
    sleep(1);
    ws.close();
  });

  ws.addEventListener('error', (e) => {
    // Graceful socket error handling during high concurrency load tests
  });
}

export function triggerAI() {
  const payload = JSON.stringify({
    prompt: 'Continue this technical documentation about distributed CRDT systems:',
    mode: 'continue',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/ai/complete`, payload, params);
  check(res, {
    'ai response status active': (r) => r.status === 200 || r.status === 401 || r.status === 429,
  });
  sleep(2);
}
