const serviceRegistry = new Map<string, unknown>();

export function registerService<T>(name: string, instance: T): void {
  if (serviceRegistry.has(name)) {
    throw new Error(`Service "${name}" is already registered`);
  }
  serviceRegistry.set(name, instance);
}

export function getService<T>(name: string): T {
  const svc = serviceRegistry.get(name);
  if (!svc) {
    throw new Error(`Service "${name}" not found. Did you forget to register it?`);
  }
  return svc as T;
}

export function listServices(): string[] {
  return Array.from(serviceRegistry.keys());
}
