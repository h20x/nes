import { StatusFlag as SF } from './cpu';

type CPU = {
  a: number;
  x: number;
  y: number;
  p: number;
  s: number;
  pc: number;
  o: number;
  addr: number;
  dmEnabled: boolean;
  irqSignal: boolean;
  irqScheduled: boolean;
  nmiSignal: boolean;
  nmiScheduled: boolean;
  fetchOperand(): void;
  read(addr?: number): number;
  readWord(addr?: number, zeroPage?: boolean): number;
  write(addr: number, val: number): void;
  flag(flag: SF): number;
  flag(flag: SF, val: number | boolean): void;
  push(val: number): void;
  pushWord(val: number): void;
  pop(): number;
  popWord(): number;
};

type Instruction = [(cpu: CPU) => void, (cpu: CPU) => number];

export const INSTRUCTIONS: Instruction[] = [
  [brk, (c: CPU) => (imp(c), 7)],
  [ora, (c: CPU) => (iix(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [ora, (c: CPU) => (zpg(c), 3)],
  [asl, (c: CPU) => (zpg(c), 5)],
  [nop, (c: CPU) => (imp(c), 2)],
  [php, (c: CPU) => (imp(c), 3)],
  [ora, (c: CPU) => (imm(c), 2)],
  [asl, (c: CPU) => (acc(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [ora, (c: CPU) => abs(c) + 4],
  [asl, (c: CPU) => (abs(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [bpl, (c: CPU) => (!c.flag(SF.N) ? rel(c) + 3 : (c.read(), 2))],
  [ora, (c: CPU) => iiy(c) + 5],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [ora, (c: CPU) => (zpx(c), 4)],
  [asl, (c: CPU) => (zpx(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [clc, (c: CPU) => (imp(c), 2)],
  [ora, (c: CPU) => aby(c) + 4],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [ora, (c: CPU) => abx(c) + 4],
  [asl, (c: CPU) => (abx(c), 7)],
  [nop, (c: CPU) => (imp(c), 2)],
  [jsr, (c: CPU) => (abs(c), 6)],
  [and, (c: CPU) => (iix(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [bit, (c: CPU) => (zpg(c), 3)],
  [and, (c: CPU) => (zpg(c), 3)],
  [rol, (c: CPU) => (zpg(c), 5)],
  [nop, (c: CPU) => (imp(c), 2)],
  [plp, (c: CPU) => (imp(c), 4)],
  [and, (c: CPU) => (imm(c), 2)],
  [rol, (c: CPU) => (acc(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [bit, (c: CPU) => (abs(c), 4)],
  [and, (c: CPU) => (abs(c), 4)],
  [rol, (c: CPU) => (abs(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [bmi, (c: CPU) => (c.flag(SF.N) ? rel(c) + 3 : (c.read(), 2))],
  [and, (c: CPU) => iiy(c) + 5],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [and, (c: CPU) => (zpx(c), 4)],
  [rol, (c: CPU) => (zpx(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [sec, (c: CPU) => (imp(c), 2)],
  [and, (c: CPU) => aby(c) + 4],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [and, (c: CPU) => abx(c) + 4],
  [rol, (c: CPU) => (abx(c), 7)],
  [nop, (c: CPU) => (imp(c), 2)],
  [rti, (c: CPU) => (imp(c), 6)],
  [eor, (c: CPU) => (iix(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [eor, (c: CPU) => (zpg(c), 3)],
  [lsr, (c: CPU) => (zpg(c), 5)],
  [nop, (c: CPU) => (imp(c), 2)],
  [pha, (c: CPU) => (imp(c), 3)],
  [eor, (c: CPU) => (imm(c), 2)],
  [lsr, (c: CPU) => (acc(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [jmp, (c: CPU) => (abs(c), 3)],
  [eor, (c: CPU) => abs(c) + 4],
  [lsr, (c: CPU) => (abs(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [bvc, (c: CPU) => (!c.flag(SF.V) ? rel(c) + 3 : (c.read(), 2))],
  [eor, (c: CPU) => iiy(c) + 5],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [eor, (c: CPU) => (zpx(c), 4)],
  [lsr, (c: CPU) => (zpx(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [cli, (c: CPU) => (imp(c), 2)],
  [eor, (c: CPU) => aby(c) + 4],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [eor, (c: CPU) => abx(c) + 4],
  [lsr, (c: CPU) => (abx(c), 7)],
  [nop, (c: CPU) => (imp(c), 2)],
  [rts, (c: CPU) => (imp(c), 6)],
  [adc, (c: CPU) => (iix(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [adc, (c: CPU) => (zpg(c), 3)],
  [ror, (c: CPU) => (zpg(c), 5)],
  [nop, (c: CPU) => (imp(c), 2)],
  [pla, (c: CPU) => (imp(c), 4)],
  [adc, (c: CPU) => (imm(c), 2)],
  [ror, (c: CPU) => (acc(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [jmp, (c: CPU) => (ind(c), 5)],
  [adc, (c: CPU) => abs(c) + 4],
  [ror, (c: CPU) => (abs(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [bvs, (c: CPU) => (c.flag(SF.V) ? rel(c) + 3 : (c.read(), 2))],
  [adc, (c: CPU) => iiy(c) + 5],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [adc, (c: CPU) => (zpx(c), 4)],
  [ror, (c: CPU) => (zpx(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [sei, (c: CPU) => (imp(c), 2)],
  [adc, (c: CPU) => aby(c) + 4],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [adc, (c: CPU) => abx(c) + 4],
  [ror, (c: CPU) => (abx(c), 7)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [sta, (c: CPU) => (iix(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [sty, (c: CPU) => (zpg(c), 3)],
  [sta, (c: CPU) => (zpg(c), 3)],
  [stx, (c: CPU) => (zpg(c), 3)],
  [nop, (c: CPU) => (imp(c), 2)],
  [dey, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [txa, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [sty, (c: CPU) => (abs(c), 4)],
  [sta, (c: CPU) => (abs(c), 4)],
  [stx, (c: CPU) => (abs(c), 4)],
  [nop, (c: CPU) => (imp(c), 2)],
  [bcc, (c: CPU) => (!c.flag(SF.C) ? rel(c) + 3 : (c.read(), 2))],
  [sta, (c: CPU) => (iiy(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [sty, (c: CPU) => (zpx(c), 4)],
  [sta, (c: CPU) => (zpx(c), 4)],
  [stx, (c: CPU) => (zpy(c), 4)],
  [nop, (c: CPU) => (imp(c), 2)],
  [tya, (c: CPU) => (imp(c), 2)],
  [sta, (c: CPU) => (aby(c), 5)],
  [txs, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [sta, (c: CPU) => (abx(c), 5)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [ldy, (c: CPU) => (imm(c), 2)],
  [lda, (c: CPU) => (iix(c), 6)],
  [ldx, (c: CPU) => (imm(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [ldy, (c: CPU) => (zpg(c), 3)],
  [lda, (c: CPU) => (zpg(c), 3)],
  [ldx, (c: CPU) => (zpg(c), 3)],
  [nop, (c: CPU) => (imp(c), 2)],
  [tay, (c: CPU) => (imp(c), 2)],
  [lda, (c: CPU) => (imm(c), 2)],
  [tax, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [ldy, (c: CPU) => abs(c) + 4],
  [lda, (c: CPU) => abs(c) + 4],
  [ldx, (c: CPU) => abs(c) + 4],
  [nop, (c: CPU) => (imp(c), 2)],
  [bcs, (c: CPU) => (c.flag(SF.C) ? rel(c) + 3 : (c.read(), 2))],
  [lda, (c: CPU) => iiy(c) + 5],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [ldy, (c: CPU) => (zpx(c), 4)],
  [lda, (c: CPU) => (zpx(c), 4)],
  [ldx, (c: CPU) => (zpy(c), 4)],
  [nop, (c: CPU) => (imp(c), 2)],
  [clv, (c: CPU) => (imp(c), 2)],
  [lda, (c: CPU) => aby(c) + 4],
  [tsx, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [ldy, (c: CPU) => abx(c) + 4],
  [lda, (c: CPU) => abx(c) + 4],
  [ldx, (c: CPU) => aby(c) + 4],
  [nop, (c: CPU) => (imp(c), 2)],
  [cpy, (c: CPU) => (imm(c), 2)],
  [cmp, (c: CPU) => (iix(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [cpy, (c: CPU) => (zpg(c), 3)],
  [cmp, (c: CPU) => (zpg(c), 3)],
  [dec, (c: CPU) => (zpg(c), 5)],
  [nop, (c: CPU) => (imp(c), 2)],
  [iny, (c: CPU) => (imp(c), 2)],
  [cmp, (c: CPU) => (imm(c), 2)],
  [dex, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [cpy, (c: CPU) => (abs(c), 4)],
  [cmp, (c: CPU) => abs(c) + 4],
  [dec, (c: CPU) => (abs(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [bne, (c: CPU) => (!c.flag(SF.Z) ? rel(c) + 3 : (c.read(), 2))],
  [cmp, (c: CPU) => iiy(c) + 5],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [cmp, (c: CPU) => (zpx(c), 4)],
  [dec, (c: CPU) => (zpx(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [cld, (c: CPU) => (imp(c), 2)],
  [cmp, (c: CPU) => aby(c) + 4],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [cmp, (c: CPU) => abx(c) + 4],
  [dec, (c: CPU) => (abx(c), 7)],
  [nop, (c: CPU) => (imp(c), 2)],
  [cpx, (c: CPU) => (imm(c), 2)],
  [sbc, (c: CPU) => (iix(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [cpx, (c: CPU) => (zpg(c), 3)],
  [sbc, (c: CPU) => (zpg(c), 3)],
  [inc, (c: CPU) => (zpg(c), 5)],
  [nop, (c: CPU) => (imp(c), 2)],
  [inx, (c: CPU) => (imp(c), 2)],
  [sbc, (c: CPU) => (imm(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [cpx, (c: CPU) => (abs(c), 4)],
  [sbc, (c: CPU) => abs(c) + 4],
  [inc, (c: CPU) => (abs(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [beq, (c: CPU) => (c.flag(SF.Z) ? rel(c) + 3 : (c.read(), 2))],
  [sbc, (c: CPU) => iiy(c) + 5],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [sbc, (c: CPU) => (zpx(c), 4)],
  [inc, (c: CPU) => (zpx(c), 6)],
  [nop, (c: CPU) => (imp(c), 2)],
  [sed, (c: CPU) => (imp(c), 2)],
  [sbc, (c: CPU) => aby(c) + 4],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [nop, (c: CPU) => (imp(c), 2)],
  [sbc, (c: CPU) => abx(c) + 4],
  [inc, (c: CPU) => (abx(c), 7)],
  [nop, (c: CPU) => (imp(c), 2)],
];

// ADDRESSING MODES

// Implicit
function imp(cpu: CPU): number {
  cpu.addr = -1;

  return 0;
}

// Accumulator
function acc(cpu: CPU): number {
  cpu.addr = -1;
  cpu.o = cpu.a;

  return 0;
}

// Immediate
function imm(cpu: CPU): number {
  cpu.addr = -1;
  cpu.o = cpu.read();

  return 0;
}

// Zero Page
function zpg(cpu: CPU): number {
  cpu.addr = cpu.read();

  return 0;
}

// Zero Page,X
function zpx(cpu: CPU): number {
  cpu.addr = (cpu.read() + cpu.x) & 0xff;

  return 0;
}

// Zero Page,Y
function zpy(cpu: CPU): number {
  cpu.addr = (cpu.read() + cpu.y) & 0xff;

  return 0;
}

// Relative
function rel(cpu: CPU): number {
  cpu.addr = -1;
  let offset = (cpu.o = cpu.read());

  if (offset & 0x80) {
    offset |= ~0xff;
  }

  return +((cpu.pc & 0xff00) !== ((cpu.pc + offset) & 0xff00));
}

// Absolute
function abs(cpu: CPU, index: number = 0): number {
  cpu.addr = cpu.readWord();
  const page = cpu.addr & 0xff00;
  cpu.addr += index;

  return +(page !== (cpu.addr & 0xff00));
}

// Absolute,X
function abx(cpu: CPU): number {
  return abs(cpu, cpu.x);
}

// Absolute,Y
function aby(cpu: CPU): number {
  return abs(cpu, cpu.y);
}

// Indirect
function ind(cpu: CPU): number {
  cpu.addr = cpu.readWord();

  if ((cpu.addr & 0xff) === 0xff) {
    cpu.addr = cpu.read(cpu.addr) | (cpu.read(cpu.addr & 0xff00) << 8);
  } else {
    cpu.addr = cpu.readWord(cpu.addr);
  }

  return 0;
}

// Indexed Indirect
function iix(cpu: CPU): number {
  cpu.addr = cpu.readWord(cpu.read() + cpu.x, true);

  return 0;
}

// Indirect Indexed
function iiy(cpu: CPU): number {
  cpu.addr = cpu.readWord(cpu.read(), true);
  const page = cpu.addr & 0xff00;
  cpu.addr += cpu.y;

  return +(page !== (cpu.addr & 0xff00));
}

// INSTRUCTIONS

function adc(cpu: CPU, operandFetched: boolean = false): void {
  if (!operandFetched) {
    cpu.fetchOperand();
  }

  if (cpu.flag(SF.D) && cpu.dmEnabled) {
    return adcd(cpu);
  }

  const sum = cpu.a + cpu.o + cpu.flag(SF.C);

  cpu.flag(SF.C, sum > 0xff);
  cpu.flag(SF.Z, !(sum & 0xff));
  // adding two numbers of the same sign must produce a result of the same sign,
  // otherwise overflow happened
  // http://teaching.idallen.com/dat2343/11w/notes/040_overflow.txt
  cpu.flag(
    SF.V,
    // signA === signB && signA !== signSum
    // (cpu.a & 0x80) === (cpu.o & 0x80) && (cpu.a & 0x80) !== (sum & 0x80)
    ~(cpu.a ^ cpu.o) & (cpu.a ^ sum) & 0x80
  );
  cpu.flag(SF.N, sum & 0x80);

  cpu.a = sum;
}

function adcd(cpu: CPU): void {
  let l = (cpu.a & 0x0f) + (cpu.o & 0x0f) + cpu.flag(SF.C);

  if (l > 0x09) {
    l = ((l + 0x06) & 0x0f) + 0x10;
  }

  let sum = (cpu.a & 0xf0) + (cpu.o & 0xf0) + l;

  cpu.flag(SF.C, sum > 0x99);

  if (sum > 0x99) {
    sum += 0x60;
  }

  cpu.a = sum;
}

function and(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.a &= cpu.o;

  cpu.flag(SF.Z, !cpu.a);
  cpu.flag(SF.N, cpu.a & 0x80);
}

function asl(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.flag(SF.C, cpu.o & 0x80);

  cpu.o = cpu.o << 1;

  cpu.flag(SF.Z, !cpu.o);
  cpu.flag(SF.N, cpu.o & 0x80);

  if (cpu.addr < 0) {
    cpu.a = cpu.o;
  } else {
    cpu.write(cpu.addr, cpu.o);
  }
}

function bcc(cpu: CPU): void {
  if (!cpu.flag(SF.C)) {
    bra(cpu);
  }
}

function bcs(cpu: CPU): void {
  if (cpu.flag(SF.C)) {
    bra(cpu);
  }
}

function beq(cpu: CPU): void {
  if (cpu.flag(SF.Z)) {
    bra(cpu);
  }
}

function bit(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.flag(SF.Z, !(cpu.a & cpu.o));
  cpu.flag(SF.V, cpu.o & 0x40);
  cpu.flag(SF.N, cpu.o & 0x80);
}

function bmi(cpu: CPU): void {
  if (cpu.flag(SF.N)) {
    bra(cpu);
  }
}

function bne(cpu: CPU): void {
  if (!cpu.flag(SF.Z)) {
    bra(cpu);
  }
}

function bpl(cpu: CPU): void {
  if (!cpu.flag(SF.N)) {
    bra(cpu);
  }
}

function bra(cpu: CPU): void {
  let offset = cpu.o;

  if (offset & 0x80) {
    offset |= ~0xff;
  }

  cpu.pc += offset;
}

function brk(cpu: CPU): void {
  cpu.pushWord(cpu.pc + 1);
  cpu.push(cpu.p | SF.B);

  cpu.flag(SF.I, 1);

  cpu.pc = cpu.readWord(0xfffe);
}

function bvc(cpu: CPU): void {
  if (!cpu.flag(SF.V)) {
    bra(cpu);
  }
}

function bvs(cpu: CPU): void {
  if (cpu.flag(SF.V)) {
    bra(cpu);
  }
}

function clc(cpu: CPU): void {
  cpu.flag(SF.C, 0);
}

function cld(cpu: CPU): void {
  cpu.flag(SF.D, 0);
}

function cli(cpu: CPU): void {
  cpu.flag(SF.I, 0);
}

function clv(cpu: CPU): void {
  cpu.flag(SF.V, 0);
}

function cmp(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.flag(SF.C, cpu.a >= cpu.o);
  cpu.flag(SF.Z, cpu.a === cpu.o);
  cpu.flag(SF.N, (cpu.a - cpu.o) & 0x80);
}

function cpx(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.flag(SF.C, cpu.x >= cpu.o);
  cpu.flag(SF.Z, cpu.x === cpu.o);
  cpu.flag(SF.N, (cpu.x - cpu.o) & 0x80);
}

function cpy(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.flag(SF.C, cpu.y >= cpu.o);
  cpu.flag(SF.Z, cpu.y === cpu.o);
  cpu.flag(SF.N, (cpu.y - cpu.o) & 0x80);
}

function dec(cpu: CPU): void {
  cpu.fetchOperand();

  --cpu.o;
  cpu.write(cpu.addr, cpu.o);

  cpu.flag(SF.Z, !cpu.o);
  cpu.flag(SF.N, cpu.o & 0x80);
}

function dex(cpu: CPU): void {
  --cpu.x;

  cpu.flag(SF.Z, !cpu.x);
  cpu.flag(SF.N, cpu.x & 0x80);
}

function dey(cpu: CPU): void {
  --cpu.y;

  cpu.flag(SF.Z, !cpu.y);
  cpu.flag(SF.N, cpu.y & 0x80);
}

function eor(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.a ^= cpu.o;

  cpu.flag(SF.Z, !cpu.a);
  cpu.flag(SF.N, cpu.a & 0x80);
}

function inc(cpu: CPU): void {
  cpu.fetchOperand();

  ++cpu.o;
  cpu.write(cpu.addr, cpu.o);

  cpu.flag(SF.Z, !cpu.o);
  cpu.flag(SF.N, cpu.o & 0x80);
}

function inx(cpu: CPU): void {
  ++cpu.x;

  cpu.flag(SF.Z, !cpu.x);
  cpu.flag(SF.N, cpu.x & 0x80);
}

function iny(cpu: CPU): void {
  ++cpu.y;

  cpu.flag(SF.Z, !cpu.y);
  cpu.flag(SF.N, cpu.y & 0x80);
}

function jmp(cpu: CPU): void {
  cpu.pc = cpu.addr;
}

function jsr(cpu: CPU): void {
  cpu.pushWord(cpu.pc - 1);

  cpu.pc = cpu.addr;
}

function lda(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.a = cpu.o;

  cpu.flag(SF.Z, !cpu.a);
  cpu.flag(SF.N, cpu.a & 0x80);
}

function ldx(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.x = cpu.o;

  cpu.flag(SF.Z, !cpu.x);
  cpu.flag(SF.N, cpu.x & 0x80);
}

function ldy(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.y = cpu.o;

  cpu.flag(SF.Z, !cpu.y);
  cpu.flag(SF.N, cpu.y & 0x80);
}

function lsr(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.flag(SF.C, cpu.o & 0x01);

  cpu.o = cpu.o >> 1;

  cpu.flag(SF.Z, !cpu.o);
  cpu.flag(SF.N, cpu.o & 0x80);

  if (cpu.addr < 0) {
    cpu.a = cpu.o;
  } else {
    cpu.write(cpu.addr, cpu.o);
  }
}

function nop(cpu: CPU): void {
  // do nothing
}

function ora(cpu: CPU): void {
  cpu.fetchOperand();

  cpu.a |= cpu.o;

  cpu.flag(SF.Z, !cpu.a);
  cpu.flag(SF.N, cpu.a & 0x80);
}

function pha(cpu: CPU): void {
  cpu.push(cpu.a);
}

function php(cpu: CPU): void {
  cpu.push(cpu.p | SF.B);
}

function pla(cpu: CPU): void {
  cpu.a = cpu.pop();

  cpu.flag(SF.Z, !cpu.a);
  cpu.flag(SF.N, cpu.a & 0x80);
}

function plp(cpu: CPU): void {
  cpu.p = cpu.pop() & ~SF.B;
}

function rol(cpu: CPU): void {
  cpu.fetchOperand();

  const cf = cpu.flag(SF.C);

  cpu.flag(SF.C, cpu.o & 0x80);

  cpu.o = (cpu.o << 1) | cf;

  cpu.flag(SF.Z, !cpu.o);
  cpu.flag(SF.N, cpu.o & 0x80);

  if (cpu.addr < 0) {
    cpu.a = cpu.o;
  } else {
    cpu.write(cpu.addr, cpu.o);
  }
}

function ror(cpu: CPU): void {
  cpu.fetchOperand();

  const cf = cpu.flag(SF.C);

  cpu.flag(SF.C, cpu.o & 0x01);

  cpu.o = (cpu.o >> 1) | (cf << 7);

  cpu.flag(SF.Z, !cpu.o);
  cpu.flag(SF.N, cpu.o & 0x80);

  if (cpu.addr < 0) {
    cpu.a = cpu.o;
  } else {
    cpu.write(cpu.addr, cpu.o);
  }
}

function rti(cpu: CPU): void {
  cpu.p = cpu.pop() & ~SF.B;
  cpu.pc = cpu.popWord();

  if (cpu.irqScheduled && cpu.flag(SF.I)) {
    cpu.irqScheduled = false;
  }

  if (cpu.irqSignal && !cpu.flag(SF.I)) {
    cpu.irqScheduled = true;
  }
}

function rts(cpu: CPU): void {
  cpu.pc = cpu.popWord() + 1;
}

function sbc(cpu: CPU): void {
  cpu.fetchOperand();

  if (cpu.flag(SF.D) && cpu.dmEnabled) {
    return sbcd(cpu);
  }

  // a - m - (1 - c) = a + (-m) - 1 + c = a + (~m + 1) - 1 + c =
  // = a + ~m + 1 - 1 + c = a + ~m + c
  // so addition can be used
  cpu.o = ~cpu.o;
  adc(cpu, true);
}

function sbcd(cpu: CPU): void {
  let l = (cpu.a & 0x0f) - (cpu.o & 0x0f) + cpu.flag(SF.C) - 1;

  if (l < 0) {
    l = ((l - 0x06) & 0x0f) - 0x10;
  }

  let sub = (cpu.a & 0xf0) - (cpu.o & 0xf0) + l;

  cpu.flag(SF.C, sub >= 0);

  if (sub < 0) {
    sub -= 0x60;
  }

  cpu.a = sub;
}

function sec(cpu: CPU): void {
  cpu.flag(SF.C, 1);
}

function sed(cpu: CPU): void {
  cpu.flag(SF.D, 1);
}

function sei(cpu: CPU): void {
  cpu.flag(SF.I, 1);
}

function sta(cpu: CPU): void {
  cpu.write(cpu.addr, cpu.a);
}

function stx(cpu: CPU): void {
  cpu.write(cpu.addr, cpu.x);
}

function sty(cpu: CPU): void {
  cpu.write(cpu.addr, cpu.y);
}

function tax(cpu: CPU): void {
  cpu.x = cpu.a;

  cpu.flag(SF.Z, !cpu.x);
  cpu.flag(SF.N, cpu.x & 0x80);
}

function tay(cpu: CPU): void {
  cpu.y = cpu.a;

  cpu.flag(SF.Z, !cpu.y);
  cpu.flag(SF.N, cpu.y & 0x80);
}

function tsx(cpu: CPU): void {
  cpu.x = cpu.s;

  cpu.flag(SF.Z, !cpu.x);
  cpu.flag(SF.N, cpu.x & 0x80);
}

function txa(cpu: CPU): void {
  cpu.a = cpu.x;

  cpu.flag(SF.Z, !cpu.a);
  cpu.flag(SF.N, cpu.a & 0x80);
}

function txs(cpu: CPU): void {
  cpu.s = cpu.x;
}

function tya(cpu: CPU): void {
  cpu.a = cpu.y;

  cpu.flag(SF.Z, !cpu.a);
  cpu.flag(SF.N, cpu.a & 0x80);
}
