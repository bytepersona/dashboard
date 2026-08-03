import { create } from 'zustand';
import { clamp } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CoreStat {
  id: number;
  usage: number;   // 0-100
  freq: number;    // MHz
  temp: number;    // °C
}

export interface NetworkSample {
  time: string;
  rxMbps: number;
  txMbps: number;
}

export interface InferenceSample {
  time: string;
  reqPerSec: number;
  tokensPerSec: number;
  queueDepth: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface HistorySample {
  time: string;
  cpuAvg: number;
  ramPct: number;
  gpuPct: number;
}

export interface LogEntry {
  id: number;
  ts: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  service: string;
  message: string;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  triggeredAt: string;
  resolved: boolean;
}

export interface ModelCard {
  id: string;
  name: string;
  family: string;
  params: string;
  status: 'loaded' | 'loading' | 'unloading' | 'error';
  vramUsed: number;   // GiB
  vramTotal: number;  // GiB
  reqPerSec: number;
  avgLatencyMs: number;
  lastUsed: string;
  device: string;
}

export interface QueueJob {
  id: string;
  model: string;
  status: 'running' | 'queued' | 'done' | 'failed';
  tokens: number;
  waitMs: number;
  inferMs: number;
  createdAt: string;
}

export interface ServerState {
  // System
  hostname: string;
  uptimeSeconds: number;
  osVersion: string;
  kernelVersion: string;

  // CPU
  cores: CoreStat[];
  cpuModel: string;
  loadAvg1: number;
  loadAvg5: number;
  loadAvg15: number;

  // RAM
  ramTotalGib: number;
  ramUsedGib: number;
  swapTotalGib: number;
  swapUsedGib: number;
  ramCachedGib: number;

  // GPU / VRAM
  gpuUtil: number;   // 0-100
  vramTotalGib: number;
  vramUsedGib: number;

  // Storage (3 mounts)
  storage: {
    mount: string;
    totalGib: number;
    usedGib: number;
    readMbps: number;
    writeMbps: number;
    iops: number;
  }[];

  // Network
  networkHistory: NetworkSample[];
  rxTotal: number;
  txTotal: number;
  packetsIn: number;
  packetsOut: number;
  latencyMs: number;

  // Inference
  inferenceHistory: InferenceSample[];
  activeRequests: number;

  // System history (24h window of 2s ticks)
  systemHistory: HistorySample[];

  // Logs
  logs: LogEntry[];

  // Alerts
  alerts: Alert[];

  // Models
  models: ModelCard[];

  // Queue
  queue: QueueJob[];

  // Tick
  tick: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _logId = 1000;
let _jobId = 1;

function nowStr(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function isoNow(): string {
  return new Date().toISOString();
}

/** Jitter a value around a center, clamped */
function jitter(val: number, amount: number, min = 0, max = 100): number {
  return clamp(val + (Math.random() - 0.5) * 2 * amount, min, max);
}

/** Gaussian-ish spike: occasionally returns a high value */
function spiky(base: number, spikeChance = 0.05, spikeAmt = 30): number {
  if (Math.random() < spikeChance) return clamp(base + spikeAmt * Math.random(), 0, 100);
  return jitter(base, 4);
}

// ─── Log message pool ─────────────────────────────────────────────────────────

const LOG_POOL: { level: LogEntry['level']; service: string; message: string }[] = [
  { level: 'INFO',  service: 'inference-gateway', message: 'Request dispatched to model llama-3-70b (req_id=a7f3c21)' },
  { level: 'INFO',  service: 'tokenizer',         message: 'Tokenized 1024 tokens in 1.2ms (batch_size=8)' },
  { level: 'DEBUG', service: 'cuda-manager',      message: 'Kernel launch: attn_fwd block=128 grid=256 device=cuda:0' },
  { level: 'INFO',  service: 'queue-worker',      message: 'Job job_00438 completed in 312ms, 847 tokens generated' },
  { level: 'DEBUG', service: 'model-loader',      message: 'Layer weights loaded from cache (/data/models/llama3-70b/shard-0.bin)' },
  { level: 'INFO',  service: 'inference-gateway', message: 'New connection from 10.0.1.47:52341 (client_id=cli_9b2e)' },
  { level: 'WARN',  service: 'vram-monitor',      message: 'VRAM usage at 78% on cuda:0 — consider offloading idle model shards' },
  { level: 'INFO',  service: 'health-check',      message: 'All services healthy (latency p99=142ms)' },
  { level: 'DEBUG', service: 'scheduler',         message: 'Assigned job job_00439 to worker-3 (load=0.34)' },
  { level: 'ERROR', service: 'model-loader',      message: 'Failed to load shard mistral-7b/shard-2.bin: checksum mismatch' },
  { level: 'INFO',  service: 'tokenizer',         message: 'BPE vocab loaded: 32000 tokens, 128k context window' },
  { level: 'WARN',  service: 'thermal-monitor',   message: 'CPU temp 82°C on core 3 — thermal throttle threshold at 90°C' },
  { level: 'INFO',  service: 'metrics-collector', message: 'Prometheus scrape completed: 1,247 time series exported' },
  { level: 'DEBUG', service: 'cuda-manager',      message: 'NCCL all-reduce completed in 4.7ms (16-tensor, 2 GPUs)' },
  { level: 'INFO',  service: 'auth-middleware',   message: 'API key validated for org=acme-corp, quota_remaining=48291' },
  { level: 'ERROR', service: 'inference-gateway', message: 'Timeout waiting for model response after 30000ms (req_id=b2d8e11)' },
  { level: 'INFO',  service: 'queue-worker',      message: 'Queue depth: 3 jobs pending, 2 running' },
  { level: 'DEBUG', service: 'kv-cache',          message: 'Cache hit ratio: 0.71 (last 1000 requests)' },
  { level: 'WARN',  service: 'disk-monitor',      message: '/data/models at 83% capacity — 141GB remaining' },
  { level: 'INFO',  service: 'load-balancer',     message: 'Rebalanced: worker-1=31%, worker-2=35%, worker-3=34%' },
];

function randomLogEntry(): LogEntry {
  const tpl = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
  return {
    id: _logId++,
    ts: nowStr(),
    level: tpl.level,
    service: tpl.service,
    message: tpl.message,
  };
}

function randomJob(modelName: string): QueueJob {
  const tokens = Math.floor(200 + Math.random() * 2000);
  const waitMs = Math.floor(Math.random() * 800);
  const inferMs = Math.floor(100 + tokens * 0.18 + Math.random() * 200);
  return {
    id: `job_${String(_jobId++).padStart(5, '0')}`,
    model: modelName,
    status: Math.random() < 0.1 ? 'failed' : Math.random() < 0.3 ? 'running' : Math.random() < 0.5 ? 'queued' : 'done',
    tokens,
    waitMs,
    inferMs,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 120000)).toLocaleTimeString('en-US', { hour12: false }),
  };
}

// ─── Initial state ─────────────────────────────────────────────────────────────

const CORE_COUNT = 16;

function makeInitialCores(): CoreStat[] {
  return Array.from({ length: CORE_COUNT }, (_, i) => ({
    id: i,
    usage: 20 + Math.random() * 50,
    freq: 3200 + Math.floor(Math.random() * 800),
    temp: 45 + Math.floor(Math.random() * 25),
  }));
}

function makeInitialHistory(): HistorySample[] {
  return Array.from({ length: 60 }, (_, i) => {
    const cpuAvg = 30 + Math.sin(i / 8) * 15 + Math.random() * 10;
    return {
      time: new Date(Date.now() - (60 - i) * 2000).toLocaleTimeString('en-US', { hour12: false }),
      cpuAvg: clamp(cpuAvg, 5, 95),
      ramPct: clamp(55 + Math.sin(i / 12) * 8 + Math.random() * 5, 40, 90),
      gpuPct: clamp(65 + Math.sin(i / 5) * 20 + Math.random() * 8, 20, 98),
    };
  });
}

function makeInitialNetworkHistory(): NetworkSample[] {
  return Array.from({ length: 60 }, (_, i) => ({
    time: new Date(Date.now() - (60 - i) * 2000).toLocaleTimeString('en-US', { hour12: false }),
    rxMbps: clamp(200 + Math.sin(i / 6) * 80 + Math.random() * 40, 10, 800),
    txMbps: clamp(150 + Math.sin(i / 7) * 60 + Math.random() * 30, 10, 600),
  }));
}

function makeInitialInferenceHistory(): InferenceSample[] {
  return Array.from({ length: 60 }, (_, i) => ({
    time: new Date(Date.now() - (60 - i) * 2000).toLocaleTimeString('en-US', { hour12: false }),
    reqPerSec: clamp(12 + Math.sin(i / 5) * 6 + Math.random() * 3, 1, 40),
    tokensPerSec: clamp(4200 + Math.sin(i / 4) * 800 + Math.random() * 400, 500, 8000),
    queueDepth: Math.floor(clamp(2 + Math.sin(i / 8) * 3 + Math.random() * 2, 0, 12)),
    p50: clamp(85 + Math.random() * 20, 50, 200),
    p95: clamp(180 + Math.random() * 60, 100, 500),
    p99: clamp(320 + Math.random() * 100, 200, 900),
  }));
}

const INITIAL_MODELS: ModelCard[] = [
  { id: 'llama3-70b',  name: 'Llama 3 70B',       family: 'Meta Llama 3',     params: '70B',  status: 'loaded',    vramUsed: 38.4, vramTotal: 40,  reqPerSec: 8.2,  avgLatencyMs: 142, lastUsed: '2s ago',   device: 'cuda:0+cuda:1' },
  { id: 'mistral-7b',  name: 'Mistral 7B Instruct',family: 'Mistral AI',       params: '7B',   status: 'loaded',    vramUsed: 5.1,  vramTotal: 10,  reqPerSec: 22.4, avgLatencyMs: 38,  lastUsed: 'now',       device: 'cuda:0' },
  { id: 'clip-vit-l',  name: 'CLIP ViT-L/14',      family: 'OpenAI CLIP',      params: '307M', status: 'loaded',    vramUsed: 1.4,  vramTotal: 2,   reqPerSec: 41.0, avgLatencyMs: 12,  lastUsed: '1m ago',    device: 'cuda:1' },
  { id: 'gpt-neox-20b',name: 'GPT-NeoX 20B',       family: 'EleutherAI',       params: '20B',  status: 'unloading', vramUsed: 0.2,  vramTotal: 20,  reqPerSec: 0,    avgLatencyMs: 0,   lastUsed: '14m ago',   device: 'cuda:1' },
  { id: 'whisper-lg',  name: 'Whisper Large v3',    family: 'OpenAI Whisper',   params: '1.5B', status: 'loaded',    vramUsed: 2.9,  vramTotal: 3,   reqPerSec: 4.1,  avgLatencyMs: 220, lastUsed: '30s ago',   device: 'cuda:0' },
  { id: 'sdxl-turbo',  name: 'SDXL Turbo',          family: 'Stability AI',     params: '2.6B', status: 'error',     vramUsed: 0,    vramTotal: 8,   reqPerSec: 0,    avgLatencyMs: 0,   lastUsed: '2h ago',    device: 'cuda:1' },
];

const INITIAL_QUEUE: QueueJob[] = Array.from({ length: 18 }, () =>
  randomJob(['llama3-70b','mistral-7b','whisper-lg','clip-vit-l'][Math.floor(Math.random() * 4)])
);

const INITIAL_ALERTS: Alert[] = [
  { id: 'a1', severity: 'critical', title: 'VRAM Pressure',        message: 'cuda:0 VRAM at 94% — model offloading triggered', triggeredAt: '2026-08-03 14:52:11', resolved: false },
  { id: 'a2', severity: 'warning',  title: 'High CPU Temperature', message: 'Core 3 at 84°C — approaching thermal limit (90°C)', triggeredAt: '2026-08-03 15:01:33', resolved: false },
  { id: 'a3', severity: 'warning',  title: 'Disk Space Low',       message: '/data/models at 83% — 141 GB remaining', triggeredAt: '2026-08-03 13:28:00', resolved: false },
  { id: 'a4', severity: 'info',     title: 'Model Loaded',         message: 'Llama 3 70B loaded successfully on cuda:0+cuda:1', triggeredAt: '2026-08-03 09:14:05', resolved: false },
  { id: 'a5', severity: 'critical', title: 'Inference Timeout',    message: '3 requests timed out (>30s) in the last 5 minutes', triggeredAt: '2026-08-03 14:38:44', resolved: true },
  { id: 'a6', severity: 'warning',  title: 'Queue Spike',          message: 'Queue depth exceeded 10 for 90 seconds', triggeredAt: '2026-08-03 12:07:18', resolved: true },
];

const INITIAL_LOGS: LogEntry[] = Array.from({ length: 60 }, () => randomLogEntry()).reverse();

// ─── Store ─────────────────────────────────────────────────────────────────────

interface ServerStore extends ServerState {
  tick: number;
  tickServer: () => void;
}

export const useServerStore = create<ServerStore>((set) => ({
  hostname: 'bp-inference-01.prod.bytepersona.io',
  uptimeSeconds: 14 * 86400 + 7 * 3600 + 42 * 60 + 18,
  osVersion: 'Ubuntu 24.04 LTS',
  kernelVersion: '6.8.0-45-generic',

  cpuModel: 'AMD EPYC 9554 64-Core (16-core slice)',
  cores: makeInitialCores(),
  loadAvg1: 4.82,
  loadAvg5: 5.11,
  loadAvg15: 4.98,

  ramTotalGib: 64,
  ramUsedGib: 38.7,
  swapTotalGib: 32,
  swapUsedGib: 1.4,
  ramCachedGib: 12.3,

  gpuUtil: 71,
  vramTotalGib: 80,
  vramUsedGib: 47.8,

  storage: [
    { mount: '/',             totalGib: 500,  usedGib: 142,  readMbps: 120, writeMbps: 45,  iops: 3200  },
    { mount: '/data/models',  totalGib: 2000, usedGib: 1659, readMbps: 840, writeMbps: 210, iops: 8800  },
    { mount: '/data/logs',    totalGib: 1000, usedGib: 312,  readMbps: 22,  writeMbps: 180, iops: 1100  },
  ],

  networkHistory: makeInitialNetworkHistory(),
  rxTotal: 4_820_000_000,
  txTotal: 2_140_000_000,
  packetsIn: 18_432_000,
  packetsOut: 9_217_000,
  latencyMs: 0.48,

  inferenceHistory: makeInitialInferenceHistory(),
  activeRequests: 7,

  systemHistory: makeInitialHistory(),

  logs: INITIAL_LOGS,
  alerts: INITIAL_ALERTS,
  models: INITIAL_MODELS,
  queue: INITIAL_QUEUE,
  tick: 0,

  tickServer: () => set((s) => {
    const t = s.tick + 1;
    const timeStr = nowStr();

    // CPU cores
    const cores = s.cores.map((c) => ({
      ...c,
      usage: spiky(c.usage, 0.04, 8),
      freq: clamp(c.freq + (Math.random() - 0.5) * 100, 2400, 4200),
      temp: clamp(c.temp + (Math.random() - 0.5) * 2, 35, 92),
    }));

    // Load avg
    const cpuAvg = cores.reduce((a, b) => a + b.usage, 0) / cores.length;
    const loadAvg1 = jitter(s.loadAvg1, 0.4, 0.1, CORE_COUNT * 0.9);

    // RAM with occasional GC
    const gcEvent = Math.random() < 0.03;
    const ramUsedGib = clamp(
      gcEvent ? s.ramUsedGib - 2.5 : s.ramUsedGib + (Math.random() - 0.45) * 0.3,
      20, 62
    );

    // VRAM
    const vramUsedGib = clamp(s.vramUsedGib + (Math.random() - 0.5) * 0.5, 30, 79);
    const gpuUtil = clamp(s.gpuUtil + (Math.random() - 0.5) * 8, 30, 99);

    // Network
    const rxMbps = clamp(jitter(
      s.networkHistory[s.networkHistory.length - 1]?.rxMbps ?? 200, 40, 10, 900
    ), 10, 900);
    const txMbps = clamp(jitter(
      s.networkHistory[s.networkHistory.length - 1]?.txMbps ?? 150, 30, 10, 700
    ), 10, 700);
    const networkHistory = [
      ...s.networkHistory.slice(-119),
      { time: timeStr, rxMbps, txMbps },
    ];

    // Inference
    const reqPerSec = clamp(jitter(
      s.inferenceHistory[s.inferenceHistory.length - 1]?.reqPerSec ?? 12, 3, 0, 50
    ), 0, 50);
    const tokensPerSec = clamp(reqPerSec * (380 + Math.random() * 80), 0, 10000);
    const queueDepth = Math.floor(clamp(jitter(
      s.inferenceHistory[s.inferenceHistory.length - 1]?.queueDepth ?? 3, 2, 0, 15
    ), 0, 15));
    const inferenceHistory = [
      ...s.inferenceHistory.slice(-119),
      {
        time: timeStr,
        reqPerSec,
        tokensPerSec,
        queueDepth,
        p50: clamp(85 + Math.random() * 30, 40, 300),
        p95: clamp(200 + Math.random() * 80, 100, 600),
        p99: clamp(380 + Math.random() * 120, 200, 1000),
      },
    ];

    // System history
    const systemHistory = [
      ...s.systemHistory.slice(-239),
      { time: timeStr, cpuAvg, ramPct: (ramUsedGib / s.ramTotalGib) * 100, gpuPct: gpuUtil },
    ];

    // Storage — slow drift
    const storage = s.storage.map((d) => ({
      ...d,
      readMbps: clamp(d.readMbps + (Math.random() - 0.5) * 60, 5, 1200),
      writeMbps: clamp(d.writeMbps + (Math.random() - 0.5) * 30, 2, 600),
      iops: Math.floor(clamp(d.iops + (Math.random() - 0.5) * 400, 100, 15000)),
    }));

    // Logs — append ~1 entry every 2 ticks
    const newLog = Math.random() < 0.6 ? [randomLogEntry()] : [];
    const logs = [...s.logs.slice(-199), ...newLog];

    // Queue — occasionally add a new job, remove old done/failed
    const modelNames = ['llama3-70b','mistral-7b','whisper-lg','clip-vit-l'];
    const newJob = Math.random() < 0.25 ? [randomJob(modelNames[Math.floor(Math.random() * modelNames.length)])] : [];
    const queue = [
      ...newJob,
      ...s.queue.slice(-49).map((j) => ({
        ...j,
        // advance running jobs toward done
        status: j.status === 'running' && Math.random() < 0.15
          ? ('done' as const)
          : j.status === 'queued' && Math.random() < 0.2
          ? ('running' as const)
          : j.status,
      })),
    ];

    // Models — update reqPerSec
    const models = s.models.map((m) => ({
      ...m,
      reqPerSec: m.status === 'loaded'
        ? clamp(m.reqPerSec + (Math.random() - 0.5) * 2, 0, 60)
        : m.reqPerSec,
    }));

    return {
      tick: t,
      cores,
      loadAvg1,
      loadAvg5: jitter(s.loadAvg5, 0.2, 0.1, CORE_COUNT * 0.9),
      loadAvg15: jitter(s.loadAvg15, 0.1, 0.1, CORE_COUNT * 0.9),
      ramUsedGib,
      vramUsedGib,
      gpuUtil,
      networkHistory,
      rxTotal: s.rxTotal + Math.floor(rxMbps * 125000 * 2),
      txTotal: s.txTotal + Math.floor(txMbps * 125000 * 2),
      packetsIn: s.packetsIn + Math.floor(Math.random() * 5000),
      packetsOut: s.packetsOut + Math.floor(Math.random() * 3000),
      latencyMs: clamp(s.latencyMs + (Math.random() - 0.5) * 0.1, 0.1, 3.0),
      inferenceHistory,
      activeRequests: Math.floor(clamp(jitter(s.activeRequests, 3, 0, 20), 0, 20)),
      systemHistory,
      storage,
      logs,
      queue,
      models,
      uptimeSeconds: s.uptimeSeconds + 2,
    };
  }),
}));
