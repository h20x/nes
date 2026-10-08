#pragma once

#include <cstdint>

using u8 = uint8_t;
using u16 = uint16_t;
using u32 = uint32_t;

class Mapper {
public:
  enum Mirroring {
    Horizontal,
    Vertical,
    SingleScreenLo,
    SingleScreenHi,
    FourScreen,
  };

  Mapper(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize, Mirroring mirroring,
         bool altNametableLayout);

  ~Mapper();

  u8 ram[0x8000 - 0x4020]{};

  virtual u8 cpuRead(u16 addr);

  virtual void cpuWrite(u16 addr, u8 val);

  bool cpuAddrMapped(u16 addr);

  virtual u8 ppuRead(u16 addr);

  virtual void ppuWrite(u16 addr, u8 val);

  bool ppuAddrMapped(u16 addr);

  u8 prgBanksCount();

  u8 chrgBanksCount();

  virtual bool isIRQ();

  virtual void scanline();

protected:
  u8 *prg;

  u32 prgSize;

  u8 *chr;

  u32 chrSize;

  Mirroring mirroring;

  bool altNametableLayout;

  u32 prgBank[2]{};

  u32 chrBank[2]{};

  u32 prgBankSize = 16384;

  u32 chrBankSize = 4096;

private:
  bool chrAllocated = false;

  u8 nametable0[1024]{};

  u8 nametable1[1024]{};

  u8 nametable2[1024]{};

  u8 nametable3[1024]{};

  u8 *getNametable(u16 addr);
};

class Mapper0 : public Mapper {
public:
  Mapper0(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize, Mirroring mirroring,
          bool altNametableLayout);
};

class Mapper1 : public Mapper {
public:
  Mapper1(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize, Mirroring mirroring,
          bool altNametableLayout);

  void cpuWrite(u16 addr, u8 val) override;

  void reset();

private:
  // load register
  u16 lr = 0x0200;

  // control register
  u16 cr = 0x0c;
};

class Mapper2 : public Mapper {
public:
  Mapper2(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize, Mirroring mirroring,
          bool altNametableLayout);

  void cpuWrite(u16 addr, u8 val) override;
};

class Mapper3 : public Mapper {
public:
  Mapper3(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize, Mirroring mirroring,
          bool altNametableLayout);

  void cpuWrite(u16 addr, u8 val) override;
};

class Mapper4 : public Mapper {
public:
  Mapper4(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize, Mirroring mirroring,
          bool altNametableLayout);

  u8 cpuRead(u16 addr) override;

  void cpuWrite(u16 addr, u8 val) override;

  u8 ppuRead(u16 addr) override;

  void ppuWrite(u16 addr, u8 val) override;

  bool isIRQ() override;

  void scanline() override;

protected:
  u32 prgBank[4]{};

  u32 chrBank[8]{};

private:
  u8 bankRegister = 0;

  bool irq = false;

  bool irqEnabled = false;

  u8 irqCounter = 0;

  u8 irqReloadValue = 0;

  u32 getCHRBank(u16 addr);
};

class Mapper7 : public Mapper {
public:
  Mapper7(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize, Mirroring mirroring,
          bool altNametableLayout);

  void cpuWrite(u16 addr, u8 val) override;
};
