// Frontend service connecting to Vite backend SSE serial stream and status API

export interface Esp32Telemetry {
  ntcAdc: number | null;
  ntcTemp: number | null;
  ds18b20Temp: number | null;
  busVoltage: number | null;
  shuntVoltage: number | null;
  currentMa: number | null;
  powerMw: number | null;
  lastUpdated: string;
}

export interface SerialLineEntry {
  line: string;
  timestamp: string;
  id: number;
}

export interface Esp32Status {
  connected: boolean;
  port: string | null;
  baudRate: number;
}

type TelemetryListener = (telemetry: Esp32Telemetry) => void;
type LineListener = (entry: SerialLineEntry) => void;
type StatusListener = (status: Esp32Status) => void;

class Esp32Service {
  private eventSource: EventSource | null = null;
  private telemetryListeners = new Set<TelemetryListener>();
  private lineListeners = new Set<LineListener>();
  private statusListeners = new Set<StatusListener>();

  private lineCounter = 0;
  private recentLines: SerialLineEntry[] = [];
  private currentStatus: Esp32Status = {
    connected: false,
    port: null,
    baudRate: 115200,
  };
  private currentTelemetry: Esp32Telemetry = {
    ntcAdc: null,
    ntcTemp: null,
    ds18b20Temp: null,
    busVoltage: null,
    shuntVoltage: null,
    currentMa: null,
    powerMw: null,
    lastUpdated: new Date().toISOString(),
  };

  private reconnectTimer: any = null;
  private isConnecting = false;

  constructor() {
    this.init();
  }

  public init() {
    if (typeof window === 'undefined') return;
    this.connectSSE();
    this.fetchInitialStatus();
  }

  private async fetchInitialStatus() {
    try {
      const res = await fetch('/api/esp32/status');
      if (res.ok) {
        const data = await res.json();
        this.currentStatus = {
          connected: data.connected,
          port: data.port,
          baudRate: data.baudRate || 115200,
        };
        if (data.telemetry) {
          this.currentTelemetry = data.telemetry;
          this.notifyTelemetry(this.currentTelemetry);
        }
        if (Array.isArray(data.recentLines) && this.recentLines.length === 0) {
          data.recentLines.forEach((l: string) => {
            this.pushLine(l);
          });
        }
        this.notifyStatus(this.currentStatus);
      }
    } catch {
      // ignore network errors on init
    }
  }

  private connectSSE() {
    if (this.eventSource || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const es = new EventSource('/api/esp32/stream');
      this.eventSource = es;

      es.addEventListener('status', (evt: MessageEvent) => {
        try {
          const data = JSON.parse(evt.data);
          this.currentStatus = {
            connected: data.connected,
            port: data.port,
            baudRate: data.baudRate,
          };
          this.notifyStatus(this.currentStatus);
        } catch (e) {
          console.warn('[ESP32Service] Failed to parse status event', e);
        }
      });

      es.addEventListener('telemetry', (evt: MessageEvent) => {
        try {
          const data: Esp32Telemetry = JSON.parse(evt.data);
          this.currentTelemetry = data;
          this.notifyTelemetry(data);
        } catch (e) {
          console.warn('[ESP32Service] Failed to parse telemetry event', e);
        }
      });

      es.addEventListener('line', (evt: MessageEvent) => {
        try {
          const data = JSON.parse(evt.data);
          this.pushLine(data.line, data.timestamp);
        } catch {
          this.pushLine(evt.data);
        }
      });

      es.onopen = () => {
        this.isConnecting = false;
      };

      es.onerror = () => {
        this.isConnecting = false;
        this.currentStatus.connected = false;
        this.notifyStatus(this.currentStatus);
        this.closeSSE();
        // Retry in 3s
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connectSSE();
          }, 3000);
        }
      };
    } catch (err) {
      this.isConnecting = false;
      console.warn('[ESP32Service] Error initializing EventSource:', err);
    }
  }

  private closeSSE() {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // ignore
      }
      this.eventSource = null;
    }
  }

  private pushLine(line: string, timestamp?: string) {
    const ts = timestamp || new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    } as any);

    const entry: SerialLineEntry = {
      id: ++this.lineCounter,
      line,
      timestamp: ts,
    };

    this.recentLines.push(entry);
    if (this.recentLines.length > 600) {
      this.recentLines.shift();
    }

    this.notifyLine(entry);
  }

  private notifyTelemetry(telemetry: Esp32Telemetry) {
    this.telemetryListeners.forEach(listener => {
      try {
        listener(telemetry);
      } catch (err) {
        console.error(err);
      }
    });
  }

  private notifyLine(entry: SerialLineEntry) {
    this.lineListeners.forEach(listener => {
      try {
        listener(entry);
      } catch (err) {
        console.error(err);
      }
    });
  }

  private notifyStatus(status: Esp32Status) {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Public API
  public getStatus(): Esp32Status {
    return this.currentStatus;
  }

  public getTelemetry(): Esp32Telemetry {
    return this.currentTelemetry;
  }

  public getRecentLines(): SerialLineEntry[] {
    return [...this.recentLines];
  }

  public clearLines() {
    this.recentLines = [];
  }

  public subscribeTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    listener(this.currentTelemetry);
    return () => this.telemetryListeners.delete(listener);
  }

  public subscribeLines(listener: LineListener): () => void {
    this.lineListeners.add(listener);
    return () => this.lineListeners.delete(listener);
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => this.statusListeners.delete(listener);
  }

  public async sendCommand(command: string): Promise<boolean> {
    try {
      const res = await fetch('/api/esp32/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const esp32Service = new Esp32Service();
