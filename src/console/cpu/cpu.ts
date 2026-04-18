import { ICPUBus } from '../bus';

export const CPU_CLOCK_RATE = 1789773;

enum Flag {
  C = 1 << 0,
  Z = 1 << 1,
  I = 1 << 2,
  D = 1 << 3,
  B = 1 << 4,
  U = 1 << 5,
  V = 1 << 6,
  N = 1 << 7,
}

type Instruction = [() => void, () => number];

const OAMDATA = 0x2004;
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

  private pageCrossed: boolean = false;

  private dmEnabled: boolean = false;

  private irqSignal: boolean = false;

  private irqScheduled: boolean = false;

  private nmiSignal: boolean = false;

  private nmiScheduled: boolean = false;

  private dmaScheduled: boolean = false;

  private rcb: ((addr: number, val: number) => void) | null = null;

  private wcb: ((addr: number, val: number) => void) | null = null;

  private ecb: ((cpu: CPU) => void) | null = null;

  // instruction table
  private it: Instruction[] = [
    [this.brk, () => (this.imp(), 7)],
    [this.ora, () => (this.iix(), 6 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.ora, () => (this.zpg(), 3 + +this.pageCrossed)],
    [this.asl, () => (this.zpg(), 5)],
    [this.nop, () => (this.imp(), 2)],
    [this.php, () => (this.imp(), 3)],
    [this.ora, () => (this.imm(), 2 + +this.pageCrossed)],
    [this.asl, () => (this.acc(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.ora, () => (this.abs(), 4 + +this.pageCrossed)],
    [this.asl, () => (this.abs(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [
      this.bpl,
      () => (this.rel(), 2 + (!this.flag(Flag.N) ? +this.pageCrossed + 1 : 0)),
    ],
    [this.ora, () => (this.iiy(), 5 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.ora, () => (this.zpx(), 4 + +this.pageCrossed)],
    [this.asl, () => (this.zpx(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [this.clc, () => (this.imp(), 2)],
    [this.ora, () => (this.aby(), 4 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.ora, () => (this.abx(), 4 + +this.pageCrossed)],
    [this.asl, () => (this.abx(), 7)],
    [this.nop, () => (this.imp(), 2)],
    [this.jsr, () => (this.abs(), 6)],
    [this.and, () => (this.iix(), 6 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.bit, () => (this.zpg(), 3)],
    [this.and, () => (this.zpg(), 3 + +this.pageCrossed)],
    [this.rol, () => (this.zpg(), 5)],
    [this.nop, () => (this.imp(), 2)],
    [this.plp, () => (this.imp(), 4)],
    [this.and, () => (this.imm(), 2 + +this.pageCrossed)],
    [this.rol, () => (this.acc(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.bit, () => (this.abs(), 4)],
    [this.and, () => (this.abs(), 4 + +this.pageCrossed)],
    [this.rol, () => (this.abs(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [
      this.bmi,
      () => (this.rel(), 2 + (this.flag(Flag.N) ? +this.pageCrossed + 1 : 0)),
    ],
    [this.and, () => (this.iiy(), 5 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.and, () => (this.zpx(), 4 + +this.pageCrossed)],
    [this.rol, () => (this.zpx(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [this.sec, () => (this.imp(), 2)],
    [this.and, () => (this.aby(), 4 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.and, () => (this.abx(), 4 + +this.pageCrossed)],
    [this.rol, () => (this.abx(), 7)],
    [this.nop, () => (this.imp(), 2)],
    [this.rti, () => (this.imp(), 6)],
    [this.eor, () => (this.iix(), 6 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.eor, () => (this.zpg(), 3 + +this.pageCrossed)],
    [this.lsr, () => (this.zpg(), 5)],
    [this.nop, () => (this.imp(), 2)],
    [this.pha, () => (this.imp(), 3)],
    [this.eor, () => (this.imm(), 2 + +this.pageCrossed)],
    [this.lsr, () => (this.acc(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.jmp, () => (this.abs(), 3)],
    [this.eor, () => (this.abs(), 4 + +this.pageCrossed)],
    [this.lsr, () => (this.abs(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [
      this.bvc,
      () => (this.rel(), 2 + (!this.flag(Flag.V) ? +this.pageCrossed + 1 : 0)),
    ],
    [this.eor, () => (this.iiy(), 5 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.eor, () => (this.zpx(), 4 + +this.pageCrossed)],
    [this.lsr, () => (this.zpx(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [this.cli, () => (this.imp(), 2)],
    [this.eor, () => (this.aby(), 4 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.eor, () => (this.abx(), 4 + +this.pageCrossed)],
    [this.lsr, () => (this.abx(), 7)],
    [this.nop, () => (this.imp(), 2)],
    [this.rts, () => (this.imp(), 6)],
    [this.adc, () => (this.iix(), 6 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.adc, () => (this.zpg(), 3 + +this.pageCrossed)],
    [this.ror, () => (this.zpg(), 5)],
    [this.nop, () => (this.imp(), 2)],
    [this.pla, () => (this.imp(), 4)],
    [this.adc, () => (this.imm(), 2 + +this.pageCrossed)],
    [this.ror, () => (this.acc(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.jmp, () => (this.ind(), 5)],
    [this.adc, () => (this.abs(), 4 + +this.pageCrossed)],
    [this.ror, () => (this.abs(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [
      this.bvs,
      () => (this.rel(), 2 + (this.flag(Flag.V) ? +this.pageCrossed + 1 : 0)),
    ],
    [this.adc, () => (this.iiy(), 5 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.adc, () => (this.zpx(), 4 + +this.pageCrossed)],
    [this.ror, () => (this.zpx(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [this.sei, () => (this.imp(), 2)],
    [this.adc, () => (this.aby(), 4 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.adc, () => (this.abx(), 4 + +this.pageCrossed)],
    [this.ror, () => (this.abx(), 7)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.sta, () => (this.iix(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.sty, () => (this.zpg(), 3)],
    [this.sta, () => (this.zpg(), 3)],
    [this.stx, () => (this.zpg(), 3)],
    [this.nop, () => (this.imp(), 2)],
    [this.dey, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.txa, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.sty, () => (this.abs(), 4)],
    [this.sta, () => (this.abs(), 4)],
    [this.stx, () => (this.abs(), 4)],
    [this.nop, () => (this.imp(), 2)],
    [
      this.bcc,
      () => (this.rel(), 2 + (!this.flag(Flag.C) ? +this.pageCrossed + 1 : 0)),
    ],
    [this.sta, () => (this.iiy(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.sty, () => (this.zpx(), 4)],
    [this.sta, () => (this.zpx(), 4)],
    [this.stx, () => (this.zpy(), 4)],
    [this.nop, () => (this.imp(), 2)],
    [this.tya, () => (this.imp(), 2)],
    [this.sta, () => (this.aby(), 5)],
    [this.txs, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.sta, () => (this.abx(), 5)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.ldy, () => (this.imm(), 2 + +this.pageCrossed)],
    [this.lda, () => (this.iix(), 6 + +this.pageCrossed)],
    [this.ldx, () => (this.imm(), 2 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.ldy, () => (this.zpg(), 3 + +this.pageCrossed)],
    [this.lda, () => (this.zpg(), 3 + +this.pageCrossed)],
    [this.ldx, () => (this.zpg(), 3 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.tay, () => (this.imp(), 2)],
    [this.lda, () => (this.imm(), 2 + +this.pageCrossed)],
    [this.tax, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.ldy, () => (this.abs(), 4 + +this.pageCrossed)],
    [this.lda, () => (this.abs(), 4 + +this.pageCrossed)],
    [this.ldx, () => (this.abs(), 4 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [
      this.bcs,
      () => (this.rel(), 2 + (this.flag(Flag.C) ? +this.pageCrossed + 1 : 0)),
    ],
    [this.lda, () => (this.iiy(), 5 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.ldy, () => (this.zpx(), 4 + +this.pageCrossed)],
    [this.lda, () => (this.zpx(), 4 + +this.pageCrossed)],
    [this.ldx, () => (this.zpy(), 4 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.clv, () => (this.imp(), 2)],
    [this.lda, () => (this.aby(), 4 + +this.pageCrossed)],
    [this.tsx, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.ldy, () => (this.abx(), 4 + +this.pageCrossed)],
    [this.lda, () => (this.abx(), 4 + +this.pageCrossed)],
    [this.ldx, () => (this.aby(), 4 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.cpy, () => (this.imm(), 2)],
    [this.cmp, () => (this.iix(), 6 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.cpy, () => (this.zpg(), 3)],
    [this.cmp, () => (this.zpg(), 3 + +this.pageCrossed)],
    [this.dec, () => (this.zpg(), 5)],
    [this.nop, () => (this.imp(), 2)],
    [this.iny, () => (this.imp(), 2)],
    [this.cmp, () => (this.imm(), 2 + +this.pageCrossed)],
    [this.dex, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.cpy, () => (this.abs(), 4)],
    [this.cmp, () => (this.abs(), 4 + +this.pageCrossed)],
    [this.dec, () => (this.abs(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [
      this.bne,
      () => (this.rel(), 2 + (!this.flag(Flag.Z) ? +this.pageCrossed + 1 : 0)),
    ],
    [this.cmp, () => (this.iiy(), 5 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.cmp, () => (this.zpx(), 4 + +this.pageCrossed)],
    [this.dec, () => (this.zpx(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [this.cld, () => (this.imp(), 2)],
    [this.cmp, () => (this.aby(), 4 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.cmp, () => (this.abx(), 4 + +this.pageCrossed)],
    [this.dec, () => (this.abx(), 7)],
    [this.nop, () => (this.imp(), 2)],
    [this.cpx, () => (this.imm(), 2)],
    [this.sbc, () => (this.iix(), 6 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.cpx, () => (this.zpg(), 3)],
    [this.sbc, () => (this.zpg(), 3 + +this.pageCrossed)],
    [this.inc, () => (this.zpg(), 5)],
    [this.nop, () => (this.imp(), 2)],
    [this.inx, () => (this.imp(), 2)],
    [this.sbc, () => (this.imm(), 2 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.cpx, () => (this.abs(), 4)],
    [this.sbc, () => (this.abs(), 4 + +this.pageCrossed)],
    [this.inc, () => (this.abs(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [
      this.beq,
      () => (this.rel(), 2 + (this.flag(Flag.Z) ? +this.pageCrossed + 1 : 0)),
    ],
    [this.sbc, () => (this.iiy(), 5 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.sbc, () => (this.zpx(), 4 + +this.pageCrossed)],
    [this.inc, () => (this.zpx(), 6)],
    [this.nop, () => (this.imp(), 2)],
    [this.sed, () => (this.imp(), 2)],
    [this.sbc, () => (this.aby(), 4 + +this.pageCrossed)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.nop, () => (this.imp(), 2)],
    [this.sbc, () => (this.abx(), 4 + +this.pageCrossed)],
    [this.inc, () => (this.abx(), 7)],
    [this.nop, () => (this.imp(), 2)],
  ];

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
    } else {
      if (this.nmiScheduled) {
        this.nmiScheduled = false;
        this.initNMI();
        cycles = 8;
      } else if (this.irqScheduled) {
        this.irqScheduled = false;
        this.initIRQ();
        cycles = 7;
      }

      DEV && this.ecb?.(this);

      this.ir = this.read();
      cycles += this.it[this.ir][1]();
    }

    this.cyclesTotal += cycles;

    return cycles;
  }

  execEnd(): void {
    this.nmiScheduled = this.nmiSignal;

    if (!this.flag(Flag.I) && this.irqSignal) {
      this.irqScheduled = true;
    }

    if (this.dmaScheduled) {
      this.dmaScheduled = false;
      this.bus.copyOAM(this.dmaAddr);
    } else {
      this.it[this.ir][0].call(this);
    }

    this.nmiSignal = false;
    this.irqSignal = false;

    this.flag(Flag.U, 1);
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
    this.flag(Flag.I, 1);
    this.pc = this.readWord(0xfffe);
    this.ir = -1;
  }

  private initNMI(): void {
    this.pushWord(this.pc);
    this.push(this.p);
    this.flag(Flag.I, 1);
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

  private flag(flag: Flag): number;
  private flag(flag: Flag, val: number | boolean): void;
  private flag(flag: Flag, val?: number | boolean): number | void {
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

  // ADDRESSING MODES

  // Implicit
  private imp(): void {
    this.addr = -1;
  }

  // Accumulator
  private acc(): void {
    this.addr = -1;
    this.o = this.a;
  }

  // Immediate
  private imm(): void {
    this.addr = -1;
    this.o = this.read();
  }

  // Zero Page
  private zpg(): void {
    this.addr = this.read();
  }

  // Zero Page,X
  private zpx(): void {
    this.addr = (this.read() + this.x) & 0xff;
  }

  // Zero Page,Y
  private zpy(): void {
    this.addr = (this.read() + this.y) & 0xff;
  }

  // Relative
  private rel(): void {
    this.addr = -1;
    let offset = (this.o = this.read());

    if (offset & 0x80) {
      offset |= ~0xff;
    }

    this.pageCrossed = (this.pc & 0xff00) !== ((this.pc + offset) & 0xff00);
  }

  // Absolute
  private abs(index: number = 0): void {
    this.addr = this.readWord();
    const page = this.addr & 0xff00;
    this.addr += index;
    this.pageCrossed = page !== (this.addr & 0xff00);
  }

  // Absolute,X
  private abx(): void {
    this.abs(this.x);
  }

  // Absolute,Y
  private aby(): void {
    this.abs(this.y);
  }

  // Indirect
  private ind(): void {
    this.addr = this.readWord();

    if ((this.addr & 0xff) === 0xff) {
      this.addr = this.read(this.addr) | (this.read(this.addr & 0xff00) << 8);
    } else {
      this.addr = this.readWord(this.addr);
    }
  }

  // Indexed Indirect
  private iix(): void {
    this.addr = this.readWord(this.read() + this.x, true);
  }

  // Indirect Indexed
  private iiy(): void {
    this.addr = this.readWord(this.read(), true);
    const page = this.addr & 0xff00;
    this.addr += this.y;
    this.pageCrossed = page !== (this.addr & 0xff00);
  }

  // INSTRUCTIONS

  private adc(operandFetched: boolean = false): void {
    if (!operandFetched) {
      this.fetchOperand();
    }

    if (this.flag(Flag.D) && this.dmEnabled) {
      return this.adcd();
    }

    const sum = this.a + this.o + this.flag(Flag.C);

    this.flag(Flag.C, sum > 0xff);
    this.flag(Flag.Z, !(sum & 0xff));
    // adding two numbers of the same sign must produce a result of the same sign,
    // otherwise overflow happened
    // http://teaching.idallen.com/dat2343/11w/notes/040_overflow.txt
    this.flag(
      Flag.V,
      // signA === signB && signA !== signSum
      // (this.a & 0x80) === (this.o & 0x80) && (this.a & 0x80) !== (sum & 0x80)
      ~(this.a ^ this.o) & (this.a ^ sum) & 0x80
    );
    this.flag(Flag.N, sum & 0x80);

    this.a = sum;
  }

  private adcd(): void {
    let l = (this.a & 0x0f) + (this.o & 0x0f) + this.flag(Flag.C);

    if (l > 0x09) {
      l = ((l + 0x06) & 0x0f) + 0x10;
    }

    let sum = (this.a & 0xf0) + (this.o & 0xf0) + l;

    this.flag(Flag.C, sum > 0x99);

    if (sum > 0x99) {
      sum += 0x60;
    }

    this.a = sum;
  }

  private and(): void {
    this.fetchOperand();

    this.a &= this.o;

    this.flag(Flag.Z, !this.a);
    this.flag(Flag.N, this.a & 0x80);
  }

  private asl(): void {
    this.fetchOperand();

    this.flag(Flag.C, this.o & 0x80);

    this.o = this.o << 1;

    this.flag(Flag.Z, !this.o);
    this.flag(Flag.N, this.o & 0x80);

    if (this.addr < 0) {
      this.a = this.o;
    } else {
      this.write(this.addr, this.o);
    }
  }

  private bcc(): void {
    if (!this.flag(Flag.C)) {
      this.bra();
    }
  }

  private bcs(): void {
    if (this.flag(Flag.C)) {
      this.bra();
    }
  }

  private beq(): void {
    if (this.flag(Flag.Z)) {
      this.bra();
    }
  }

  private bit(): void {
    this.fetchOperand();

    this.flag(Flag.Z, !(this.a & this.o));
    this.flag(Flag.V, this.o & 0x40);
    this.flag(Flag.N, this.o & 0x80);
  }

  private bmi(): void {
    if (this.flag(Flag.N)) {
      this.bra();
    }
  }

  private bne(): void {
    if (!this.flag(Flag.Z)) {
      this.bra();
    }
  }

  private bpl(): void {
    if (!this.flag(Flag.N)) {
      this.bra();
    }
  }

  private bra(): void {
    let offset = this.o;

    if (offset & 0x80) {
      offset |= ~0xff;
    }

    this.pc += offset;
  }

  private brk(): void {
    this.pushWord(this.pc + 1);
    this.push(this.p | Flag.B);

    this.flag(Flag.I, 1);

    this.pc = this.readWord(0xfffe);
  }

  private bvc(): void {
    if (!this.flag(Flag.V)) {
      this.bra();
    }
  }

  private bvs(): void {
    if (this.flag(Flag.V)) {
      this.bra();
    }
  }

  private clc(): void {
    this.flag(Flag.C, 0);
  }

  private cld(): void {
    this.flag(Flag.D, 0);
  }

  private cli(): void {
    this.flag(Flag.I, 0);
  }

  private clv(): void {
    this.flag(Flag.V, 0);
  }

  private cmp(): void {
    this.fetchOperand();

    this.flag(Flag.C, this.a >= this.o);
    this.flag(Flag.Z, this.a === this.o);
    this.flag(Flag.N, (this.a - this.o) & 0x80);
  }

  private cpx(): void {
    this.fetchOperand();

    this.flag(Flag.C, this.x >= this.o);
    this.flag(Flag.Z, this.x === this.o);
    this.flag(Flag.N, (this.x - this.o) & 0x80);
  }

  private cpy(): void {
    this.fetchOperand();

    this.flag(Flag.C, this.y >= this.o);
    this.flag(Flag.Z, this.y === this.o);
    this.flag(Flag.N, (this.y - this.o) & 0x80);
  }

  private dec(): void {
    this.fetchOperand();

    --this.o;
    this.write(this.addr, this.o);

    this.flag(Flag.Z, !this.o);
    this.flag(Flag.N, this.o & 0x80);
  }

  private dex(): void {
    --this.x;

    this.flag(Flag.Z, !this.x);
    this.flag(Flag.N, this.x & 0x80);
  }

  private dey(): void {
    --this.y;

    this.flag(Flag.Z, !this.y);
    this.flag(Flag.N, this.y & 0x80);
  }

  private eor(): void {
    this.fetchOperand();

    this.a ^= this.o;

    this.flag(Flag.Z, !this.a);
    this.flag(Flag.N, this.a & 0x80);
  }

  private inc(): void {
    this.fetchOperand();

    ++this.o;
    this.write(this.addr, this.o);

    this.flag(Flag.Z, !this.o);
    this.flag(Flag.N, this.o & 0x80);
  }

  private inx(): void {
    ++this.x;

    this.flag(Flag.Z, !this.x);
    this.flag(Flag.N, this.x & 0x80);
  }

  private iny(): void {
    ++this.y;

    this.flag(Flag.Z, !this.y);
    this.flag(Flag.N, this.y & 0x80);
  }

  private jmp(): void {
    this.pc = this.addr;
  }

  private jsr(): void {
    this.pushWord(this.pc - 1);

    this.pc = this.addr;
  }

  private lda(): void {
    this.fetchOperand();

    this.a = this.o;

    this.flag(Flag.Z, !this.a);
    this.flag(Flag.N, this.a & 0x80);
  }

  private ldx(): void {
    this.fetchOperand();

    this.x = this.o;

    this.flag(Flag.Z, !this.x);
    this.flag(Flag.N, this.x & 0x80);
  }

  private ldy(): void {
    this.fetchOperand();

    this.y = this.o;

    this.flag(Flag.Z, !this.y);
    this.flag(Flag.N, this.y & 0x80);
  }

  private lsr(): void {
    this.fetchOperand();

    this.flag(Flag.C, this.o & 0x01);

    this.o = this.o >> 1;

    this.flag(Flag.Z, !this.o);
    this.flag(Flag.N, this.o & 0x80);

    if (this.addr < 0) {
      this.a = this.o;
    } else {
      this.write(this.addr, this.o);
    }
  }

  private nop(): void {
    // do nothing
  }

  private ora(): void {
    this.fetchOperand();

    this.a |= this.o;

    this.flag(Flag.Z, !this.a);
    this.flag(Flag.N, this.a & 0x80);
  }

  private pha(): void {
    this.push(this.a);
  }

  private php(): void {
    this.push(this.p | Flag.B);
  }

  private pla(): void {
    this.a = this.pop();

    this.flag(Flag.Z, !this.a);
    this.flag(Flag.N, this.a & 0x80);
  }

  private plp(): void {
    this.p = this.pop() & ~Flag.B;
  }

  private rol(): void {
    this.fetchOperand();

    const cf = this.flag(Flag.C);

    this.flag(Flag.C, this.o & 0x80);

    this.o = (this.o << 1) | cf;

    this.flag(Flag.Z, !this.o);
    this.flag(Flag.N, this.o & 0x80);

    if (this.addr < 0) {
      this.a = this.o;
    } else {
      this.write(this.addr, this.o);
    }
  }

  private ror(): void {
    this.fetchOperand();

    const cf = this.flag(Flag.C);

    this.flag(Flag.C, this.o & 0x01);

    this.o = (this.o >> 1) | (cf << 7);

    this.flag(Flag.Z, !this.o);
    this.flag(Flag.N, this.o & 0x80);

    if (this.addr < 0) {
      this.a = this.o;
    } else {
      this.write(this.addr, this.o);
    }
  }

  private rti(): void {
    this.p = this.pop() & ~Flag.B;
    this.pc = this.popWord();

    if (this.irqScheduled && this.flag(Flag.I)) {
      this.irqScheduled = false;
    }

    if (this.irqSignal && !this.flag(Flag.I)) {
      this.irqScheduled = true;
    }
  }

  private rts(): void {
    this.pc = this.popWord() + 1;
  }

  private sbc(): void {
    this.fetchOperand();

    if (this.flag(Flag.D) && this.dmEnabled) {
      return this.sbcd();
    }

    // a - m - (1 - c) = a + (-m) - 1 + c = a + (~m + 1) - 1 + c =
    // = a + ~m + 1 - 1 + c = a + ~m + c
    // so addition can be used
    this.o = ~this.o;
    this.adc(true);
  }

  private sbcd(): void {
    let l = (this.a & 0x0f) - (this.o & 0x0f) + this.flag(Flag.C) - 1;

    if (l < 0) {
      l = ((l - 0x06) & 0x0f) - 0x10;
    }

    let sub = (this.a & 0xf0) - (this.o & 0xf0) + l;

    this.flag(Flag.C, sub >= 0);

    if (sub < 0) {
      sub -= 0x60;
    }

    this.a = sub;
  }

  private sec(): void {
    this.flag(Flag.C, 1);
  }

  private sed(): void {
    this.flag(Flag.D, 1);
  }

  private sei(): void {
    this.flag(Flag.I, 1);
  }

  private sta(): void {
    this.write(this.addr, this.a);
  }

  private stx(): void {
    this.write(this.addr, this.x);
  }

  private sty(): void {
    this.write(this.addr, this.y);
  }

  private tax(): void {
    this.x = this.a;

    this.flag(Flag.Z, !this.x);
    this.flag(Flag.N, this.x & 0x80);
  }

  private tay(): void {
    this.y = this.a;

    this.flag(Flag.Z, !this.y);
    this.flag(Flag.N, this.y & 0x80);
  }

  private tsx(): void {
    this.x = this.s;

    this.flag(Flag.Z, !this.x);
    this.flag(Flag.N, this.x & 0x80);
  }

  private txa(): void {
    this.a = this.x;

    this.flag(Flag.Z, !this.a);
    this.flag(Flag.N, this.a & 0x80);
  }

  private txs(): void {
    this.s = this.x;
  }

  private tya(): void {
    this.a = this.y;

    this.flag(Flag.Z, !this.a);
    this.flag(Flag.N, this.a & 0x80);
  }
}
