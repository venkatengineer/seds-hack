import fs from 'node:fs';
import { execSync } from 'node:child_process';
import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import { runTrainedModelInference, modelMetadata, type MLInferenceResult } from './src/services/trainedModelInference.ts';

export interface Esp32Telemetry {
  ntcAdc: number | null;
  ntcTemp: number | null;
  ds18b20Temp: number | null;
  busVoltage: number | null;
  shuntVoltage: number | null;
  currentMa: number | null;
  powerMw: number | null;
  lastUpdated: string;
  mlDiagnosis?: MLInferenceResult | null;
}

interface SerialState {
  port: string;
  baudRate: number;
  connected: boolean;
  stream: fs.ReadStream | null;
  recentLines: string[];
  telemetry: Esp32Telemetry;
  clients: Set<any>;
}

const state: SerialState = {
  port: '/dev/ttyACM0',
  baudRate: 115200,
  connected: false,
  stream: null,
  recentLines: [],
  telemetry: {
    ntcAdc: null,
    ntcTemp: null,
    ds18b20Temp: null,
    busVoltage: null,
    shuntVoltage: null,
    currentMa: null,
    powerMw: null,
    lastUpdated: new Date().toISOString(),
  },
  clients: new Set(),
};

function broadcast(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`;
  for (const res of state.clients) {
    try {
      res.write(payload);
    } catch {
      state.clients.delete(res);
    }
  }
}

function parseLine(line: string) {
  let updated = false;

  // NTC ADC: 1863
  const ntcAdcMatch = line.match(/NTC ADC:\s*([-\d.]+)/i);
  if (ntcAdcMatch) {
    state.telemetry.ntcAdc = parseFloat(ntcAdcMatch[1]);
    updated = true;
  }

  // NTC estimated temperature: 21.0 C
  const ntcTempMatch = line.match(/NTC estimated temperature:\s*([-\d.]+)/i);
  if (ntcTempMatch) {
    state.telemetry.ntcTemp = parseFloat(ntcTempMatch[1]);
    updated = true;
  }

  // DS18B20 temperature: 27.31 C
  const ds18Match = line.match(/DS18B20 temperature:\s*([-\d.]+)/i);
  if (ds18Match) {
    state.telemetry.ds18b20Temp = parseFloat(ds18Match[1]);
    updated = true;
  }

  // INA219 bus voltage: 3.200 V
  const busMatch = line.match(/INA219 bus voltage:\s*([-\d.]+)/i);
  if (busMatch) {
    state.telemetry.busVoltage = parseFloat(busMatch[1]);
    updated = true;
  }

  // INA219 shunt voltage: 0.050 mV
  const shuntMatch = line.match(/INA219 shunt voltage:\s*([-\d.]+)/i);
  if (shuntMatch) {
    state.telemetry.shuntVoltage = parseFloat(shuntMatch[1]);
    updated = true;
  }

  // INA219 current: 0.50 mA
  const currMatch = line.match(/INA219 current:\s*([-\d.]+)/i);
  if (currMatch) {
    state.telemetry.currentMa = parseFloat(currMatch[1]);
    updated = true;
  }

  // INA219 power: 0.00 mW
  const pwrMatch = line.match(/INA219 power:\s*([-\d.]+)/i);
  if (pwrMatch) {
    state.telemetry.powerMw = parseFloat(pwrMatch[1]);
    updated = true;
  }

  if (updated) {
    state.telemetry.lastUpdated = new Date().toISOString();
    if (state.telemetry.ds18b20Temp !== null && state.telemetry.ntcTemp !== null && state.telemetry.busVoltage !== null) {
      try {
        state.telemetry.mlDiagnosis = runTrainedModelInference({
          ds18b20Temp: state.telemetry.ds18b20Temp,
          ntcTemp: state.telemetry.ntcTemp,
          ntcAdc: state.telemetry.ntcAdc ?? 1945,
          busVoltage: state.telemetry.busVoltage,
          shuntVoltage: state.telemetry.shuntVoltage ?? 0.06,
          currentMa: state.telemetry.currentMa ?? 0.60,
          powerMw: state.telemetry.powerMw ?? 2.0,
        });
      } catch (err) {
        console.warn('[ESP32] Inference error:', err);
      }
    }
    broadcast('telemetry', state.telemetry);
  }
}

let lineBuffer = '';

function startSerialReader() {
  if (state.stream) return;

  // Find candidate port
  const candidatePorts = ['/dev/ttyACM0', '/dev/ttyUSB0', '/dev/ttyACM1', '/dev/ttyUSB1'];
  let foundPort = '';
  for (const p of candidatePorts) {
    if (fs.existsSync(p)) {
      foundPort = p;
      break;
    }
  }

  if (!foundPort) {
    state.connected = false;
    broadcast('status', { connected: false, port: null, baudRate: state.baudRate });
    setTimeout(startSerialReader, 3000);
    return;
  }

  state.port = foundPort;

  try {
    execSync(`stty -F ${state.port} ${state.baudRate} raw -echo cs8 -cstopb -parenb`, { stdio: 'ignore' });
  } catch (err) {
    console.warn(`[ESP32] stty configuration failed for ${state.port}:`, err);
  }

  try {
    const stream = fs.createReadStream(state.port, { encoding: 'utf8' });
    state.stream = stream;
    state.connected = true;
    console.log(`[ESP32] Serial connected on ${state.port} @ ${state.baudRate} baud`);
    broadcast('status', { connected: true, port: state.port, baudRate: state.baudRate });

    stream.on('data', (chunk: string | Buffer) => {
      lineBuffer += chunk.toString();
      const lines = lineBuffer.split(/\r?\n/);
      lineBuffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        const entry = {
          line: line.trim(),
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any),
        };
        state.recentLines.push(`[${entry.timestamp}] ${entry.line}`);
        if (state.recentLines.length > 500) {
          state.recentLines.shift();
        }
        broadcast('line', entry);
        parseLine(entry.line);
      }
    });

    stream.on('error', (err) => {
      console.warn(`[ESP32] Stream error on ${state.port}:`, err.message);
      cleanupStream();
      setTimeout(startSerialReader, 3000);
    });

    stream.on('end', () => {
      console.log(`[ESP32] Stream closed on ${state.port}`);
      cleanupStream();
      setTimeout(startSerialReader, 3000);
    });
  } catch (err) {
    console.warn(`[ESP32] Failed to open ${state.port}:`, err);
    cleanupStream();
    setTimeout(startSerialReader, 3000);
  }
}

function cleanupStream() {
  if (state.stream) {
    try {
      state.stream.destroy();
    } catch {
      // ignore
    }
    state.stream = null;
  }
  state.connected = false;
  broadcast('status', { connected: false, port: state.port, baudRate: state.baudRate });
}

export function esp32SerialPlugin(): Plugin {
  return {
    name: 'vite-plugin-esp32-serial',
    configureServer(server: ViteDevServer) {
      startSerialReader();

      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        // 1. Status API
        if (req.url === '/api/esp32/status') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({
              connected: state.connected,
              port: state.port,
              baudRate: state.baudRate,
              telemetry: state.telemetry,
              recentLines: state.recentLines.slice(-100),
            })
          );
          return;
        }

        // 2. Real-time SSE Stream API
        if (req.url === '/api/esp32/stream') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });

          // Send immediate snapshot
          res.write(`event: status\ndata: ${JSON.stringify({ connected: state.connected, port: state.port, baudRate: state.baudRate })}\n\n`);
          res.write(`event: telemetry\ndata: ${JSON.stringify(state.telemetry)}\n\n`);

          // Send recent back-buffer lines
          for (const rawLine of state.recentLines.slice(-25)) {
            res.write(`event: line\ndata: ${JSON.stringify({ line: rawLine, timestamp: '' })}\n\n`);
          }

          state.clients.add(res);

          const keepAliveTimer = setInterval(() => {
            try {
              res.write(': keep-alive\n\n');
            } catch {
              clearInterval(keepAliveTimer);
              state.clients.delete(res);
            }
          }, 15000);

          req.on('close', () => {
            clearInterval(keepAliveTimer);
            state.clients.delete(res);
          });
          return;
        }

        // 3. Command Send API
        if (req.url === '/api/esp32/command' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { command } = JSON.parse(body || '{}');
              if (command && state.port && fs.existsSync(state.port)) {
                fs.appendFileSync(state.port, command + '\n');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, command }));
                return;
              }
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Device not ready or command empty' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 4. ML Model Metadata API
        if (req.url === '/api/ml/model') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(modelMetadata));
          return;
        }

        // 5. ML Inference API
        if (req.url === '/api/ml/infer' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const input = JSON.parse(body || '{}');
              const result = runTrainedModelInference({
                ds18b20Temp: input.ds18b20Temp ?? state.telemetry.ds18b20Temp ?? 25.0,
                ntcTemp: input.ntcTemp ?? state.telemetry.ntcTemp ?? 22.8,
                ntcAdc: input.ntcAdc ?? state.telemetry.ntcAdc ?? 1945,
                busVoltage: input.busVoltage ?? state.telemetry.busVoltage ?? 3.32,
                shuntVoltage: input.shuntVoltage ?? state.telemetry.shuntVoltage ?? 0.06,
                currentMa: input.currentMa ?? state.telemetry.currentMa ?? 0.6,
                powerMw: input.powerMw ?? state.telemetry.powerMw ?? 2.0,
              });
              res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },

    configurePreviewServer(server: PreviewServer) {
      startSerialReader();
      // Also register middleware for preview mode
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/esp32/status') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            connected: state.connected,
            port: state.port,
            baudRate: state.baudRate,
            telemetry: state.telemetry,
            recentLines: state.recentLines.slice(-100),
          }));
          return;
        }
        next();
      });
    },
  };
}
