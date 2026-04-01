// Minimal Mantine mock — Mantine is UI-only and never used in core services.
module.exports = new Proxy({}, { get: () => undefined });
