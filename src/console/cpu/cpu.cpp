#include "cpu.h"
#include "cpu-bus.h"
#include <cstdint>
#include <functional>

using u8 = uint8_t;
using u16 = uint16_t;

CPU::CPU(CPUBus *bus) : bus(bus) {}

CPU::CPU(CPUBus *bus, State state, bool ignoreDMA_) : CPU(bus) {
  a = state.a;
  x = state.x;
  y = state.y;
  p = state.p;
  s = state.s;
  pc = state.pc;
  ignoreDMA = ignoreDMA_;
}

void CPU::reset() {
  a = x = y = cyclesTotal = 0;
  s = 0xfd;
  p = 0x24;
  pc = readWord(0xfffc);
}

u16 CPU::execStart() {
  u16 cycles = 0;

  if (dmaScheduled) {
    cycles = cyclesTotal & 1 ? 514 : 513;
  } else if (nmiScheduled) {
    cycles = 8;
  } else if (irqScheduled) {
    cycles = 7;
  } else {
    if (ecb) {
      ecb();
    }

    ir = read();
    cycles = it[ir].addrmode();
  }

  cyclesTotal += cycles;

  return cycles;
}

void CPU::execEnd() {
  if (nmiScheduled) {
    nmiScheduled = false;
    initNMI();

    return;
  }

  if (irqScheduled) {
    irqScheduled = false;
    initIRQ();

    return;
  }

  nmiScheduled = nmiSignal;

  if (!flag(I) && irqSignal) {
    irqScheduled = true;
  }

  if (dmaScheduled) {
    dmaScheduled = false;
    bus->copyOAM(dmaAddr);
  } else {
    it[ir].exec(*this);
    ignoreAddr = false;
  }

  nmiSignal = false;
  irqSignal = false;

  flag(U, 1);
}

void CPU::irq() { irqSignal = true; }

void CPU::nmi() { nmiSignal = true; }

void CPU::enableDecimalMode() { dmEnabled = true; }

CPU::State CPU::getState() { return {a, x, y, p, s, pc}; }

void CPU::setReadCb(std::function<void(u16, u8)> cb) { rcb = cb; }

void CPU::setWriteCb(std::function<void(u16, u8)> cb) { wcb = cb; }

void CPU::setExecCb(std::function<void()> cb) { ecb = cb; }

void CPU::initIRQ() {
  pushWord(pc);
  push(p);
  flag(I, 1);
  pc = readWord(0xfffe);
}

void CPU::initNMI() {
  pushWord(pc);
  push(p);
  flag(I, 1);
  pc = readWord(0xfffa);
}

u8 CPU::read() { return read(pc++); }

u8 CPU::read(u16 addr) {
  u8 val = OAMDMA == addr && !ignoreDMA ? 0 : bus->read(addr);

  if (rcb) {
    rcb(addr, val);
  }

  return val;
}

u16 CPU::readWord() { return read() | (read() << 8); }

u16 CPU::readWord(u16 addr, bool zeroPage) {
  u16 m = zeroPage ? 0xff : 0xffff;

  return read(addr & m) | (read((addr + 1) & m) << 8);
}

void CPU::write(u16 addr, u8 val) {
  if (wcb) {
    wcb(addr, val);
  }

  if (OAMDMA == addr && !ignoreDMA) {
    dmaScheduled = true;
    dmaAddr = val << 8;
  } else {
    bus->write(addr, val);
  }
}

bool CPU::flag(SF flag) { return p & flag; }

void CPU::flag(SF flag, bool val) { val ? (p |= flag) : (p &= ~flag); }

void CPU::fetchOperand() {
  if (!ignoreAddr) {
    o = read(addr);
  }
}

// push on the stack
void CPU::push(u8 val) { write(0x0100 | s--, val); }

void CPU::pushWord(u16 val) {
  push(val >> 8);
  push(val);
}

// pop from the stack
u8 CPU::pop() { return read(0x0100 | ++s); }

u16 CPU::popWord() { return pop() | (pop() << 8); }

// ADDRESSING MODES

// Implied
u8 CPU::imp() {
  ignoreAddr = true;

  return 0;
}

// Accumulator
u8 CPU::acc() {
  ignoreAddr = true;
  o = a;

  return 0;
}

// Immediate
u8 CPU::imm() {
  ignoreAddr = true;
  o = read();

  return 0;
}

// Zero Page
u8 CPU::zpg() {
  addr = read();

  return 0;
}

// Zero Page,X
u8 CPU::zpx() {
  addr = (read() + x) & 0xff;

  return 0;
}

// Zero Page,Y
u8 CPU::zpy() {
  addr = (read() + y) & 0xff;

  return 0;
}

// Relative
u8 CPU::rel() {
  ignoreAddr = true;
  int8_t offset = (o = read());

  return (pc & 0xff00) != ((pc + offset) & 0xff00);
}

// Absolute
u8 CPU::abs(u8 index) {
  addr = readWord();
  u16 page = addr & 0xff00;
  addr += index;

  return page != (addr & 0xff00);
}

// Absolute,X
u8 CPU::abx() { return abs(x); }

// Absolute,Y
u8 CPU::aby() { return abs(y); }

// Indirect
u8 CPU::ind() {
  addr = readWord();

  if ((addr & 0xff) == 0xff) {
    addr = read(addr) | (read(addr & 0xff00) << 8);
  } else {
    addr = readWord(addr);
  }

  return 0;
}

// Indexed Indirect
u8 CPU::iix() {
  addr = readWord(read() + x, true);

  return 0;
}

// Indirect Indexed
u8 CPU::iiy() {
  addr = readWord(read(), true);
  u16 page = addr & 0xff00;
  addr += y;

  return page != (addr & 0xff00);
}

// INSTRUCTIONS

void CPU::adc() {
  fetchOperand();

  if (flag(D) && dmEnabled) {
    return adcd();
  }

  u16 sum = (u16)a + o + flag(C);

  flag(C, sum > 0xff);
  flag(Z, !(sum & 0xff));
  // adding two numbers of the same sign must produce a result of the same
  // sign, otherwise overflow happened
  // http://teaching.idallen.com/dat2343/11w/notes/040_overflow.txt
  flag(V,
       // signA === signB && signA !== signSum
       // (a & 0x80) === (o & 0x80) && (a & 0x80) !== (sum & 0x80)
       ~(a ^ o) & (a ^ sum) & 0x80);
  flag(N, sum & 0x80);

  a = sum;
}

void CPU::adcd() {
  u16 l = (a & 0x0f) + (o & 0x0f) + flag(C);

  if (l > 0x09) {
    l = ((l + 0x06) & 0x0f) + 0x10;
  }

  u16 sum = l + (a & 0xf0) + (o & 0xf0);

  flag(C, sum > 0x99);

  if (sum > 0x99) {
    sum += 0x60;
  }

  a = sum;
}

void CPU::AND() {
  fetchOperand();

  a &= o;

  flag(Z, !a);
  flag(N, a & 0x80);
}

void CPU::asl() {
  fetchOperand();

  flag(C, o & 0x80);

  o <<= 1;

  flag(Z, !o);
  flag(N, o & 0x80);

  if (ignoreAddr) {
    a = o;
  } else {
    write(addr, o);
  }
}

void CPU::bcc() {
  if (!flag(C)) {
    bra();
  }
}

void CPU::bcs() {
  if (flag(C)) {
    bra();
  }
}

void CPU::beq() {
  if (flag(Z)) {
    bra();
  }
}

void CPU::bit() {
  fetchOperand();

  flag(Z, !(a & o));
  flag(V, o & 0x40);
  flag(N, o & 0x80);
}

void CPU::bmi() {
  if (flag(N)) {
    bra();
  }
}

void CPU::bne() {
  if (!flag(Z)) {
    bra();
  }
}

void CPU::bpl() {
  if (!flag(N)) {
    bra();
  }
}

void CPU::bra() { pc += (int8_t)o; }

void CPU::brk() {
  pushWord(pc + 1);
  push(p | B);

  flag(I, 1);

  pc = readWord(0xfffe);
}

void CPU::bvc() {
  if (!flag(V)) {
    bra();
  }
}

void CPU::bvs() {
  if (flag(V)) {
    bra();
  }
}

void CPU::clc() { flag(C, 0); }

void CPU::cld() { flag(D, 0); }

void CPU::cli() { flag(I, 0); }

void CPU::clv() { flag(V, 0); }

void CPU::cmp() {
  fetchOperand();

  flag(C, a >= o);
  flag(Z, a == o);
  flag(N, (a - o) & 0x80);
}

void CPU::cpx() {
  fetchOperand();

  flag(C, x >= o);
  flag(Z, x == o);
  flag(N, (x - o) & 0x80);
}

void CPU::cpy() {
  fetchOperand();

  flag(C, y >= o);
  flag(Z, y == o);
  flag(N, (y - o) & 0x80);
}

void CPU::dec() {
  fetchOperand();

  --o;
  write(addr, o);

  flag(Z, !o);
  flag(N, o & 0x80);
}

void CPU::dex() {
  --x;

  flag(Z, !x);
  flag(N, x & 0x80);
}

void CPU::dey() {
  --y;

  flag(Z, !y);
  flag(N, y & 0x80);
}

void CPU::eor() {
  fetchOperand();

  a ^= o;

  flag(Z, !a);
  flag(N, a & 0x80);
}

void CPU::inc() {
  fetchOperand();

  ++o;
  write(addr, o);

  flag(Z, !o);
  flag(N, o & 0x80);
}

void CPU::inx() {
  ++x;

  flag(Z, !x);
  flag(N, x & 0x80);
}

void CPU::iny() {
  ++y;

  flag(Z, !y);
  flag(N, y & 0x80);
}

void CPU::jmp() { pc = addr; }

void CPU::jsr() {
  pushWord(pc - 1);

  pc = addr;
}

void CPU::lda() {
  fetchOperand();

  a = o;

  flag(Z, !a);
  flag(N, a & 0x80);
}

void CPU::ldx() {
  fetchOperand();

  x = o;

  flag(Z, !x);
  flag(N, x & 0x80);
}

void CPU::ldy() {
  fetchOperand();

  y = o;

  flag(Z, !y);
  flag(N, y & 0x80);
}

void CPU::lsr() {
  fetchOperand();

  flag(C, o & 0x01);

  o >>= 1;

  flag(Z, !o);
  flag(N, o & 0x80);

  if (ignoreAddr) {
    a = o;
  } else {
    write(addr, o);
  }
}

void CPU::nop() {
  // do nothing
}

void CPU::ora() {
  fetchOperand();

  a |= o;

  flag(Z, !a);
  flag(N, a & 0x80);
}

void CPU::pha() { push(a); }

void CPU::php() { push(p | B); }

void CPU::pla() {
  a = pop();

  flag(Z, !a);
  flag(N, a & 0x80);
}

void CPU::plp() { p = pop() & ~B; }

void CPU::rol() {
  fetchOperand();

  u8 cf = flag(C);

  flag(C, o & 0x80);

  o = (o << 1) | cf;

  flag(Z, !o);
  flag(N, o & 0x80);

  if (ignoreAddr) {
    a = o;
  } else {
    write(addr, o);
  }
}

void CPU::ror() {
  fetchOperand();

  u8 cf = flag(C);

  flag(C, o & 0x01);

  o = (o >> 1) | (cf << 7);

  flag(Z, !o);
  flag(N, o & 0x80);

  if (ignoreAddr) {
    a = o;
  } else {
    write(addr, o);
  }
}

void CPU::rti() {
  p = pop() & ~B;
  pc = popWord();

  if (irqScheduled && flag(I)) {
    irqScheduled = false;
  }

  if (irqSignal && !flag(I)) {
    irqScheduled = true;
  }
}

void CPU::rts() { pc = popWord() + 1; }

void CPU::sbc() {
  fetchOperand();

  if (flag(D) && dmEnabled) {
    return sbcd();
  }

  // a - m - (1 - c) = a + (-m) - 1 + c = a + (~m + 1) - 1 + c =
  // = a + ~m + 1 - 1 + c = a + ~m + c
  // so addition can be used
  o = ~o;

  u16 sum = a + o + flag(C);

  flag(C, sum > 0xff);
  flag(Z, !(sum & 0xff));
  flag(V, ~(a ^ o) & (a ^ sum) & 0x80);
  flag(N, sum & 0x80);

  a = sum;
}

void CPU::sbcd() {
  int16_t l = (int16_t)(a & 0x0f) - (o & 0x0f) + flag(C) - 1;

  if (l < 0) {
    l = ((l - 0x06) & 0x0f) - 0x10;
  }

  int16_t sub = l + (a & 0xf0) - (o & 0xf0);

  flag(C, sub >= 0);

  if (sub < 0) {
    sub -= 0x60;
  }

  a = sub;
}

void CPU::sec() { flag(C, 1); }

void CPU::sed() { flag(D, 1); }

void CPU::sei() { flag(I, 1); }

void CPU::sta() { write(addr, a); }

void CPU::stx() { write(addr, x); }

void CPU::sty() { write(addr, y); }

void CPU::tax() {
  x = a;

  flag(Z, !x);
  flag(N, x & 0x80);
}

void CPU::tay() {
  y = a;

  flag(Z, !y);
  flag(N, y & 0x80);
}

void CPU::tsx() {
  x = s;

  flag(Z, !x);
  flag(N, x & 0x80);
}

void CPU::txa() {
  a = x;

  flag(Z, !a);
  flag(N, a & 0x80);
}

void CPU::txs() { s = x; }

void CPU::tya() {
  a = y;

  flag(Z, !a);
  flag(N, a & 0x80);
}
