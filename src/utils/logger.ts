type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDebugEnabled = (): boolean => {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (level === 'debug') return true;
  return process.env.NODE_ENV !== 'production';
};

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable-meta]';
  }
};

const write = (level: LogLevel, message: string, meta?: unknown) => {
  if (level === 'debug' && !isDebugEnabled()) {
    return;
  }

  const timestamp = new Date().toISOString();
  const suffix = meta === undefined ? '' : ` ${safeStringify(meta)}`;
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${suffix}`;

  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
};

const logger = {
  debug: (message: string, meta?: unknown) => write('debug', message, meta),
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta)
};

export default logger;
