const redactSecrets = (value) => {
  if (typeof value !== "string") return value;

  return value
    .replace(/(Bearer\s+)([A-Za-z0-9-._~+/]+=*)/gi, "$1[REDACTED]")
    .replace(/(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g, "[REDACTED_JWT]")
    .replace(/(sk_[A-Za-z0-9]+)/gi, "[REDACTED_KEY]")
    .replace(/(api[_-]?key\s*[:=]\s*)([^\s,;]+)/gi, "$1[REDACTED]")
    .replace(/(otp\s*[:=]\s*)(\d{6})/gi, "$1[REDACTED]")
    .replace(/(password\s*[:=]\s*)([^\s,;]+)/gi, "$1[REDACTED]");
};

const sanitize = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }

  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, sanitize(value)])
    );
  }

  return redactSecrets(String(obj));
};

const write = (level, event, meta = {}) => {
  const payload = {
    level,
    event,
    ts: new Date().toISOString(),
    ...sanitize(meta),
  };

  const message = JSON.stringify(payload);

  if (level === "error") {
    console.error(message);
    return;
  }

  if (level === "warn") {
    console.warn(message);
    return;
  }

  console.info(message);
};

const logger = {
  info: (event, meta) => write("info", event, meta),
  warn: (event, meta) => write("warn", event, meta),
  error: (event, meta) => write("error", event, meta),
  securityEvent: (event, meta) =>
    write("warn", `security.${event}`, {
      ...meta,
      category: "security",
    }),
};

export default logger;
