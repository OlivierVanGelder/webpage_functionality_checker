export type DebugFn = (msg: string) => void;

function ts() {
  return new Date().toISOString();
}

export function createDebug(enabled = true): DebugFn {
  return (msg: string) => {
    if (!enabled) return;
    console.log(`[${ts()}] ${msg}`);
  };
}
