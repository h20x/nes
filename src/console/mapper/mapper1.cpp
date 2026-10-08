#include "mapper.h"

Mapper1::Mapper1(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize,
                 Mirroring mirroring, bool altNametableLayout)
    : Mapper(prg, prgSize, chr, chrSize, mirroring, altNametableLayout) {}

void Mapper1::reset() {
  lr = 0x0200;
  cr |= 0x0c;
  prgBank[1] = (prgBanksCount() - 1) * prgBankSize;
}

void Mapper1::cpuWrite(u16 addr, u8 val) {
  if (addr < 0x8000) {
    return Mapper::cpuWrite(addr, val);
  }

  if (val & 0x80) {
    return reset();
  }

  lr |= (val & 0x01) << 4;

  // load register is not full
  if ((lr & 0x20) == 0) {
    lr >>= 1;

    return;
  }

  u8 reg = (addr >> 13) & 0x03;
  u8 data = lr & 0x1f;
  lr = 0x0200;

  // control register
  if (0 == reg) {
    u8 m = data & 0x03;

    if (0 == m)
      mirroring = Mapper::Mirroring::SingleScreenLo;
    else if (1 == m)
      mirroring = Mapper::Mirroring::SingleScreenHi;
    else if (2 == m)
      mirroring = Mapper::Mirroring::Vertical;
    else if (3 == m)
      mirroring = Mapper::Mirroring::Horizontal;

    cr = data;

    return;
  }

  // CHR bank 0
  if (1 == reg) {
    // 4KB mode
    if (cr & 0x10) {
      chrBank[0] = data * chrBankSize;
    }
    // 8KB mode
    else {
      chrBank[0] = ((data & 0x1e) >> 1) * chrBankSize * 2;
      chrBank[1] = chrBank[0] + chrBankSize;
    }

    return;
  }

  // CHR bank 1
  if (2 == reg) {
    // 4KB mode
    if (cr & 0x10) {
      chrBank[1] = data * chrBankSize;
    }

    return;
  }

  // PRG bank
  if (3 == reg) {
    u8 bankMode = (cr & 0x0c) >> 2;

    if (bankMode < 2) {
      prgBank[0] = ((data & 0x0e) >> 1) * prgBankSize * 2;
      prgBank[1] = prgBank[0] + prgBankSize;
    } else if (bankMode == 2) {
      prgBank[0] = 0;
      prgBank[1] = (data & 0x0f) * prgBankSize;
    } else if (bankMode == 3) {
      prgBank[0] = (data & 0x0f) * prgBankSize;
      prgBank[1] = (prgBanksCount() - 1) * prgBankSize;
    }
  }
}