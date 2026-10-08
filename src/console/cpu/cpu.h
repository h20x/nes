#pragma once

#include "cpu-bus.h"
#include <cstdint>
#include <functional>

using u8 = uint8_t;
using u16 = uint16_t;

class CPU {
public:
  static const int CLOCK_RATE = 1789773;
  static const int OAMDMA = 0x4014;

  struct State {
    u16 a;
    u16 x;
    u16 y;
    u16 p;
    u16 s;
    u16 pc;
  };

  CPU(CPUBus *bus);

  CPU(CPUBus *bus, State state, bool ignoreDMA = false);

  void reset();

  u16 execStart();

  void execEnd();

  void irq();

  void nmi();

  void enableDecimalMode();

  State getState();

  void setReadCb(std::function<void(u16, u8)> cb);

  void setWriteCb(std::function<void(u16, u8)> cb);

  void setExecCb(std::function<void()> cb);

private:
  CPUBus *bus;

  std::function<void(u16, u8)> rcb;

  std::function<void(u16, u8)> wcb;

  std::function<void()> ecb;

  // StatusFlag
  enum SF {
    C = 1 << 0,
    Z = 1 << 1,
    I = 1 << 2,
    D = 1 << 3,
    B = 1 << 4,
    U = 1 << 5,
    V = 1 << 6,
    N = 1 << 7,
  };

  // accumulator
  u8 a = 0;
  // X register
  u8 x = 0;
  // Y register
  u8 y = 0;
  // status register
  u8 p = 0;
  // stack pointer
  u8 s = 0;
  // program counter
  u16 pc = 0;
  // operand
  u8 o = 0;
  // instruction register
  u8 ir = 0;
  // operand address
  u16 addr = 0;

  u16 dmaAddr = 0;

  unsigned long long cyclesTotal = 0;

  bool dmEnabled = false;

  bool irqSignal = false;

  bool irqScheduled = false;

  bool nmiSignal = false;

  bool nmiScheduled = false;

  bool dmaScheduled = false;

  bool ignoreAddr = false;

  bool ignoreDMA = false;

  struct Inst {
    std::function<void(CPU &)> exec;
    std::function<u8()> addrmode;
  };

  // instruction table
  Inst it[256]{
      // 0x00
      {&CPU::brk, [this]() { return imp(), 7; }},
      {&CPU::ora, [this]() { return iix(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::ora, [this]() { return zpg(), 3; }},
      {&CPU::asl, [this]() { return zpg(), 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::php, [this]() { return imp(), 3; }},
      {&CPU::ora, [this]() { return imm(), 2; }},
      {&CPU::asl, [this]() { return acc(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::ora, [this]() { return abs() + 4; }},
      {&CPU::asl, [this]() { return abs(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0x10
      {&CPU::bpl, [this]() { return !flag(N) ? rel() + 3 : (read(), 2); }},
      {&CPU::ora, [this]() { return iiy() + 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::ora, [this]() { return zpx(), 4; }},
      {&CPU::asl, [this]() { return zpx(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::clc, [this]() { return imp(), 2; }},
      {&CPU::ora, [this]() { return aby() + 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::ora, [this]() { return abx() + 4; }},
      {&CPU::asl, [this]() { return abx(), 7; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0x20
      {&CPU::jsr, [this]() { return abs(), 6; }},
      {&CPU::AND, [this]() { return iix(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::bit, [this]() { return zpg(), 3; }},
      {&CPU::AND, [this]() { return zpg(), 3; }},
      {&CPU::rol, [this]() { return zpg(), 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::plp, [this]() { return imp(), 4; }},
      {&CPU::AND, [this]() { return imm(), 2; }},
      {&CPU::rol, [this]() { return acc(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::bit, [this]() { return abs(), 4; }},
      {&CPU::AND, [this]() { return abs(), 4; }},
      {&CPU::rol, [this]() { return abs(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0x30
      {&CPU::bmi, [this]() { return flag(N) ? rel() + 3 : (read(), 2); }},
      {&CPU::AND, [this]() { return iiy() + 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::AND, [this]() { return zpx(), 4; }},
      {&CPU::rol, [this]() { return zpx(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::sec, [this]() { return imp(), 2; }},
      {&CPU::AND, [this]() { return aby() + 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::AND, [this]() { return abx() + 4; }},
      {&CPU::rol, [this]() { return abx(), 7; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0x40
      {&CPU::rti, [this]() { return imp(), 6; }},
      {&CPU::eor, [this]() { return iix(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::eor, [this]() { return zpg(), 3; }},
      {&CPU::lsr, [this]() { return zpg(), 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::pha, [this]() { return imp(), 3; }},
      {&CPU::eor, [this]() { return imm(), 2; }},
      {&CPU::lsr, [this]() { return acc(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::jmp, [this]() { return abs(), 3; }},
      {&CPU::eor, [this]() { return abs() + 4; }},
      {&CPU::lsr, [this]() { return abs(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0x50
      {&CPU::bvc, [this]() { return !flag(V) ? rel() + 3 : (read(), 2); }},
      {&CPU::eor, [this]() { return iiy() + 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::eor, [this]() { return zpx(), 4; }},
      {&CPU::lsr, [this]() { return zpx(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::cli, [this]() { return imp(), 2; }},
      {&CPU::eor, [this]() { return aby() + 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::eor, [this]() { return abx() + 4; }},
      {&CPU::lsr, [this]() { return abx(), 7; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0x60
      {&CPU::rts, [this]() { return imp(), 6; }},
      {&CPU::adc, [this]() { return iix(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::adc, [this]() { return zpg(), 3; }},
      {&CPU::ror, [this]() { return zpg(), 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::pla, [this]() { return imp(), 4; }},
      {&CPU::adc, [this]() { return imm(), 2; }},
      {&CPU::ror, [this]() { return acc(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::jmp, [this]() { return ind(), 5; }},
      {&CPU::adc, [this]() { return abs() + 4; }},
      {&CPU::ror, [this]() { return abs(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0x70
      {&CPU::bvs, [this]() { return flag(V) ? rel() + 3 : (read(), 2); }},
      {&CPU::adc, [this]() { return iiy() + 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::adc, [this]() { return zpx(), 4; }},
      {&CPU::ror, [this]() { return zpx(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::sei, [this]() { return imp(), 2; }},
      {&CPU::adc, [this]() { return aby() + 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::adc, [this]() { return abx() + 4; }},
      {&CPU::ror, [this]() { return abx(), 7; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0x80
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::sta, [this]() { return iix(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::sty, [this]() { return zpg(), 3; }},
      {&CPU::sta, [this]() { return zpg(), 3; }},
      {&CPU::stx, [this]() { return zpg(), 3; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::dey, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::txa, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::sty, [this]() { return abs(), 4; }},
      {&CPU::sta, [this]() { return abs(), 4; }},
      {&CPU::stx, [this]() { return abs(), 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0x90
      {&CPU::bcc, [this]() { return !flag(C) ? rel() + 3 : (read(), 2); }},
      {&CPU::sta, [this]() { return iiy(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::sty, [this]() { return zpx(), 4; }},
      {&CPU::sta, [this]() { return zpx(), 4; }},
      {&CPU::stx, [this]() { return zpy(), 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::tya, [this]() { return imp(), 2; }},
      {&CPU::sta, [this]() { return aby(), 5; }},
      {&CPU::txs, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::sta, [this]() { return abx(), 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0xa0
      {&CPU::ldy, [this]() { return imm(), 2; }},
      {&CPU::lda, [this]() { return iix(), 6; }},
      {&CPU::ldx, [this]() { return imm(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::ldy, [this]() { return zpg(), 3; }},
      {&CPU::lda, [this]() { return zpg(), 3; }},
      {&CPU::ldx, [this]() { return zpg(), 3; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::tay, [this]() { return imp(), 2; }},
      {&CPU::lda, [this]() { return imm(), 2; }},
      {&CPU::tax, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::ldy, [this]() { return abs() + 4; }},
      {&CPU::lda, [this]() { return abs() + 4; }},
      {&CPU::ldx, [this]() { return abs() + 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0xb0
      {&CPU::bcs, [this]() { return flag(C) ? rel() + 3 : (read(), 2); }},
      {&CPU::lda, [this]() { return iiy() + 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::ldy, [this]() { return zpx(), 4; }},
      {&CPU::lda, [this]() { return zpx(), 4; }},
      {&CPU::ldx, [this]() { return zpy(), 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::clv, [this]() { return imp(), 2; }},
      {&CPU::lda, [this]() { return aby() + 4; }},
      {&CPU::tsx, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::ldy, [this]() { return abx() + 4; }},
      {&CPU::lda, [this]() { return abx() + 4; }},
      {&CPU::ldx, [this]() { return aby() + 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0xc0
      {&CPU::cpy, [this]() { return imm(), 2; }},
      {&CPU::cmp, [this]() { return iix(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::cpy, [this]() { return zpg(), 3; }},
      {&CPU::cmp, [this]() { return zpg(), 3; }},
      {&CPU::dec, [this]() { return zpg(), 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::iny, [this]() { return imp(), 2; }},
      {&CPU::cmp, [this]() { return imm(), 2; }},
      {&CPU::dex, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::cpy, [this]() { return abs(), 4; }},
      {&CPU::cmp, [this]() { return abs() + 4; }},
      {&CPU::dec, [this]() { return abs(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0xd0
      {&CPU::bne, [this]() { return !flag(Z) ? rel() + 3 : (read(), 2); }},
      {&CPU::cmp, [this]() { return iiy() + 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::cmp, [this]() { return zpx(), 4; }},
      {&CPU::dec, [this]() { return zpx(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::cld, [this]() { return imp(), 2; }},
      {&CPU::cmp, [this]() { return aby() + 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::cmp, [this]() { return abx() + 4; }},
      {&CPU::dec, [this]() { return abx(), 7; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0xe0
      {&CPU::cpx, [this]() { return imm(), 2; }},
      {&CPU::sbc, [this]() { return iix(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::cpx, [this]() { return zpg(), 3; }},
      {&CPU::sbc, [this]() { return zpg(), 3; }},
      {&CPU::inc, [this]() { return zpg(), 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::inx, [this]() { return imp(), 2; }},
      {&CPU::sbc, [this]() { return imm(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::cpx, [this]() { return abs(), 4; }},
      {&CPU::sbc, [this]() { return abs() + 4; }},
      {&CPU::inc, [this]() { return abs(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      // 0xf0
      {&CPU::beq, [this]() { return flag(Z) ? rel() + 3 : (read(), 2); }},
      {&CPU::sbc, [this]() { return iiy() + 5; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::sbc, [this]() { return zpx(), 4; }},
      {&CPU::inc, [this]() { return zpx(), 6; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::sed, [this]() { return imp(), 2; }},
      {&CPU::sbc, [this]() { return aby() + 4; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
      {&CPU::sbc, [this]() { return abx() + 4; }},
      {&CPU::inc, [this]() { return abx(), 7; }},
      {&CPU::nop, [this]() { return imp(), 2; }},
  };

  void initIRQ();

  void initNMI();

  u8 read();

  u8 read(u16 addr);

  u16 readWord();

  u16 readWord(u16 addr, bool zeroPage = false);

  void write(u16 addr, u8 val);

  bool flag(SF flag);

  void flag(SF flag, bool val);

  void fetchOperand();

  // push on the stack
  void push(u8 val);

  void pushWord(u16 val);

  // pop from the stack
  u8 pop();

  u16 popWord();

  // ADDRESSING MODES

  // Implied
  u8 imp();

  // Accumulator
  u8 acc();

  // Immediate
  u8 imm();

  // Zero Page
  u8 zpg();

  // Zero Page,X
  u8 zpx();

  // Zero Page,Y
  u8 zpy();

  // Relative
  u8 rel();

  // Absolute
  u8 abs(u8 index = 0);

  // Absolute,X
  u8 abx();

  // Absolute,Y
  u8 aby();

  // Indirect
  u8 ind();

  // Indexed Indirect
  u8 iix();

  // Indirect Indexed
  u8 iiy();

  // INSTRUCTIONS

  void adc();

  void adcd();

  void AND();

  void asl();

  void bcc();

  void bcs();

  void beq();

  void bit();

  void bmi();

  void bne();

  void bpl();

  void bra();

  void brk();

  void bvc();

  void bvs();

  void clc();

  void cld();

  void cli();

  void clv();

  void cmp();

  void cpx();

  void cpy();

  void dec();

  void dex();

  void dey();

  void eor();

  void inc();

  void inx();

  void iny();

  void jmp();

  void jsr();

  void lda();

  void ldx();

  void ldy();

  void lsr();

  void nop();

  void ora();

  void pha();

  void php();

  void pla();

  void plp();

  void rol();

  void ror();

  void rti();

  void rts();

  void sbc();

  void sbcd();

  void sec();

  void sed();

  void sei();

  void sta();

  void stx();

  void sty();

  void tax();

  void tay();

  void tsx();

  void txa();

  void txs();

  void tya();
};
