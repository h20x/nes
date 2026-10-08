declare module '*.css';
declare var Module: () => Promise<WasmModule>;

interface WasmModule {
  HEAPU8: {
    buffer: ArrayBuffer;
    set: (view: ArrayBufferView, ptr: number) => void;
  };

  _free: (ptr: number | null) => void;
  _malloc: (size: number) => number;

  _init: (dataPtr: number, imageDataPtr: number) => void;
  _pressButton: (btn: number) => void;
  _releaseButton: (btn: number) => void;
  _renderFrame: () => void;
}

interface TWasmModule {
  HEAPU16: {
    buffer: ArrayBuffer;
    set: (view: ArrayBufferView, ptr: number) => void;
  };

  _free: (ptr: number | null) => void;
  _malloc: (size: number) => number;
  addFunction: (f: (...params: any[]) => any, fs: string) => number;
  getValue: (ptr: number, type: string) => number;

  _cpuCreate: (state: number, ignoreDMA: boolean) => void;
  _cpuGetState: () => number;
  _cpuExecStart: () => number;
  _cpuExecEnd: () => void;
  _cpuEnableDecimalMode: () => void;
  _cpuReset: () => void;
  _cpuNMI: () => void;
  _cpuIRQ: () => void;
  _cpuSetReadCb: (cb: number) => void;
  _cpuSetWriteCb: (cb: number) => void;
  _cpuSetExecCb: (cb: number) => void;
  _busRead: (addr: number) => number;
  _busWrite: (addr: number, val: number) => void;
}
