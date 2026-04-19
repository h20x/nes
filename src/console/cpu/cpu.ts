import { ICPUBus } from '../bus';
import { INSTRUCTIONS } from './instructions';

export const CPU_CLOCK_RATE = 1789773;

export enum StatusFlag {
  C = 1 << 0,
  Z = 1 << 1,
  I = 1 << 2,
  D = 1 << 3,
  B = 1 << 4,
  U = 1 << 5,
  V = 1 << 6,
  N = 1 << 7,
}

const OAMDMA = 0x4014;

export class CPU {
  // accumulator
  private _a: number = 0;
  get a(): number {
    return this._a;
  }
  private set a(v: number) {
    this._a = v & 0xff;
  }

  // X register
  private _x: number = 0;
  get x(): number {
    return this._x;
  }
  private set x(v: number) {
    this._x = v & 0xff;
  }

  // Y register
  private _y: number = 0;
  get y(): number {
    return this._y;
  }
  private set y(v: number) {
    this._y = v & 0xff;
  }

  // status register
  private _p: number = 0;
  get p(): number {
    return this._p;
  }
  private set p(v: number) {
    this._p = v & 0xff;
  }

  // stack pointer
  private _s: number = 0;
  get s(): number {
    return this._s;
  }
  private set s(v: number) {
    this._s = v & 0xff;
  }

  // program counter
  private _pc: number = 0;
  get pc(): number {
    return this._pc;
  }
  private set pc(v: number) {
    this._pc = v & 0xffff;
  }

  // operand
  private _o: number = 0;
  private get o(): number {
    return this._o;
  }
  private set o(v: number) {
    this._o = v & 0xff;
  }

  // instruction register
  private ir: number = 0;

  // operand address
  private addr: number = 0;

  private cyclesTotal: number = 0;

  private dmaAddr: number = 0;

  private dmEnabled: boolean = false;

  private irqSignal: boolean = false;

  private irqScheduled: boolean = false;

  private nmiSignal: boolean = false;

  private nmiScheduled: boolean = false;

  private dmaScheduled: boolean = false;

  private rcb: ((addr: number, val: number) => void) | null = null;

  private wcb: ((addr: number, val: number) => void) | null = null;

  private ecb: ((cpu: CPU) => void) | null = null;

  constructor(
    private bus: ICPUBus,
    state: Partial<{
      a: number;
      x: number;
      y: number;
      p: number;
      s: number;
      pc: number;
    }> = {},
    private ignoreDMA: boolean = false
  ) {
    const { a = 0, x = 0, y = 0, p = 0, s = 0, pc = 0 } = state;
    this.a = a;
    this.x = x;
    this.y = y;
    this.p = p;
    this.s = s;
    this.pc = pc;
  }

  reset(): void {
    this.a = this.x = this.y = this.cyclesTotal = 0;
    this.s = 0xfd;
    this.p = 0x24;
    this.pc = this.readWord(0xfffc);
  }

  execStart(): number {
    let cycles = 0;

    if (this.dmaScheduled) {
      cycles = this.cyclesTotal & 1 ? 514 : 513;
    } else if (this.nmiScheduled) {
      cycles = 8;
    } else if (this.irqScheduled) {
      cycles = 7;
    } else {
      DEV && this.ecb?.(this);
      this.ir = this.read();
      cycles = INSTRUCTIONS[this.ir][1](this as any);
    }

    this.cyclesTotal += cycles;

    return cycles;
  }

  execEnd(): void {
    if (this.nmiScheduled) {
      this.nmiScheduled = false;

      return this.initNMI();
    }

    if (this.irqScheduled) {
      this.irqScheduled = false;

      return this.initIRQ();
    }

    this.nmiScheduled = this.nmiSignal;

    if (!this.flag(StatusFlag.I) && this.irqSignal) {
      this.irqScheduled = true;
    }

    if (this.dmaScheduled) {
      this.dmaScheduled = false;
      this.bus.copyOAM(this.dmaAddr);
    } else {
      INSTRUCTIONS[this.ir][0](this as any);
    }

    this.nmiSignal = false;
    this.irqSignal = false;

    this.flag(StatusFlag.U, 1);
  }

  irq(): void {
    this.irqSignal = true;
  }

  nmi(): void {
    this.nmiSignal = true;
  }

  enableDecimalMode(): void {
    this.dmEnabled = true;
  }

  onRead(cb: (addr: number, val: number) => void): void {
    this.rcb = cb;
  }

  onWrite(cb: (addr: number, val: number) => void): void {
    this.wcb = cb;
  }

  onExec(cb: (cpu: CPU) => void): void {
    this.ecb = cb;
  }

  private initIRQ(): void {
    this.pushWord(this.pc);
    this.push(this.p);
    this.flag(StatusFlag.I, 1);
    this.pc = this.readWord(0xfffe);
    this.ir = -1;
  }

  private initNMI(): void {
    this.pushWord(this.pc);
    this.push(this.p);
    this.flag(StatusFlag.I, 1);
    this.pc = this.readWord(0xfffa);
    this.ir = -1;
  }

  private read(addr?: number): number {
    addr = addr == null ? this.pc++ : addr & 0xffff;
    const val = OAMDMA === addr && !this.ignoreDMA ? 0 : this.bus.read(addr);

    DEV && this.rcb?.(addr, val);

    return val;
  }

  private readWord(addr?: number, zeroPage: boolean = false): number {
    if (addr == null) {
      return this.read() | (this.read() << 8);
    }

    const m = zeroPage ? 0xff : 0xffff;

    return this.read(addr & m) | (this.read((addr + 1) & m) << 8);
  }

  private write(addr: number, val: number): void {
    addr &= 0xffff;
    val &= 0xff;

    DEV && this.wcb?.(addr, val);

    if (OAMDMA === addr && !this.ignoreDMA) {
      this.dmaScheduled = true;
      this.dmaAddr = val << 8;
    } else {
      this.bus.write(addr, val);
    }
  }

  private flag(flag: StatusFlag): number;
  private flag(flag: StatusFlag, val: number | boolean): void;
  private flag(flag: StatusFlag, val?: number | boolean): number | void {
    if (val == null) {
      return this.p & flag ? 1 : 0;
    }

    val ? (this.p |= flag) : (this.p &= ~flag);
  }

  private fetchOperand(): void {
    if (this.addr >= 0) {
      this.o = this.read(this.addr);
    }
  }

  // push on the stack
  private push(val: number): void {
    this.write(0x0100 | this.s--, val);
  }

  private pushWord(val: number): void {
    this.push(val >> 8);
    this.push(val);
  }

  // pop from the stack
  private pop(): number {
    ++this.s;

    return this.read(0x0100 | this.s);
  }

  private popWord(): number {
    return this.pop() | (this.pop() << 8);
  }
}
