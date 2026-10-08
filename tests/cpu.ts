let readCb: ((addr: number, val: number) => void) | null = null;

let readCbPtr: number | null = null;

const readCbWrap = (addr: number, val: number) => {
  readCb?.(addr, val);
};

let writeCb: ((addr: number, val: number) => void) | null = null;

let writeCbPtr: number | null = null;

const writeCbWrap = (addr: number, val: number) => {
  writeCb?.(addr, val);
};

let execCb: (() => void) | null = null;

let execCbPtr: number | null = null;

const execCbWrap = () => {
  execCb?.();
};

export class CPU {
  constructor(
    private wmodule: TWasmModule,
    state: Partial<{
      a: number;
      x: number;
      y: number;
      p: number;
      s: number;
      pc: number;
    }> = {},
    ignoreDMA: boolean = false
  ) {
    const { a = 0, x = 0, y = 0, p = 0, s = 0, pc = 0 } = state;
    const arr = new Uint16Array([a, x, y, p, s, pc]);
    const ptr = this.wmodule._malloc(arr.length * 2);
    const wasmMem = new Int16Array(
      this.wmodule.HEAPU16.buffer,
      ptr,
      arr.length
    );
    wasmMem.set(arr);
    this.wmodule._cpuCreate(ptr, ignoreDMA);
    this.wmodule._free(ptr);
  }

  get a(): number {
    const ptr = this.wmodule._cpuGetState();

    return this.wmodule.getValue(ptr, 'i16');
  }

  get x(): number {
    const ptr = this.wmodule._cpuGetState();

    return this.wmodule.getValue(ptr + 2, 'i16');
  }

  get y(): number {
    const ptr = this.wmodule._cpuGetState();

    return this.wmodule.getValue(ptr + 4, 'i16');
  }

  get p(): number {
    const ptr = this.wmodule._cpuGetState();

    return this.wmodule.getValue(ptr + 6, 'i16');
  }

  get s(): number {
    const ptr = this.wmodule._cpuGetState();

    return this.wmodule.getValue(ptr + 8, 'i16');
  }

  get pc(): number {
    const ptr = this.wmodule._cpuGetState();

    return this.wmodule.getValue(ptr + 10, 'i16') & 0xffff;
  }

  execStart(): number {
    return this.wmodule._cpuExecStart();
  }

  execEnd(): void {
    this.wmodule._cpuExecEnd();
  }

  enableDecimalMode(): void {
    this.wmodule._cpuEnableDecimalMode();
  }

  reset(): void {
    this.wmodule._cpuReset();
  }

  nmi(): void {
    this.wmodule._cpuNMI();
  }

  irq(): void {
    this.wmodule._cpuIRQ();
  }

  onRead(cb: (addr: number, val: number) => void): void {
    if (!readCbPtr) {
      readCbPtr = this.wmodule.addFunction(readCbWrap, 'vii');
    }

    readCb = cb;
    this.wmodule._cpuSetReadCb(readCbPtr);
  }

  onWrite(cb: (addr: number, val: number) => void): void {
    if (!writeCbPtr) {
      writeCbPtr = this.wmodule.addFunction(writeCbWrap, 'vii');
    }

    writeCb = cb;
    this.wmodule._cpuSetWriteCb(writeCbPtr);
  }

  onExec(cb: () => void): void {
    if (!execCbPtr) {
      execCbPtr = this.wmodule.addFunction(execCbWrap, 'v');
    }

    execCb = cb;
    this.wmodule._cpuSetExecCb(execCbPtr);
  }
}
