#include "mapper.h"

Mapper4::Mapper4(u8 *prg, u32 prgSize, u8 *chr, u32 chrSize,
                 Mirroring mirroring, bool altNametableLayout)
    : Mapper(prg, prgSize, chr, chrSize, mirroring, altNametableLayout) {
  prgBankSize = 8192;
  chrBankSize = 1024;
  prgBank[0] = prgBank[1] = prgBank[2] = (prgBanksCount() - 2) * prgBankSize;
  prgBank[3] = (prgBanksCount() - 1) * prgBankSize;

  if (altNametableLayout) {
    mirroring = Mirroring::FourScreen;
  }
}

u8 Mapper4::cpuRead(u16 addr) {
  if (addr < 0x8000) {
    return Mapper::cpuRead(addr);
  }

  u32 bank = prgBank[3];

  if (addr < 0xa000)
    bank = prgBank[0];
  else if (addr < 0xc000)
    bank = prgBank[1];
  else if (addr < 0xe000)
    bank = prgBank[2];

  return prg[bank | (addr & 0x1fff)];
}

void Mapper4::cpuWrite(u16 addr, u8 val) {
  if (addr < 0x8000) {
    return Mapper::cpuWrite(addr, val);
  }

  // bank select
  if (addr >= 0x0800 && addr <= 0x9fff && (addr & 0x01) == 0) {
    bankRegister = val;
  }
  // bank data
  else if (addr >= 0x0800 && addr <= 0x9fff && (addr & 0x01) == 1) {
    u8 r = bankRegister & 0x07;
    u8 prgMode = (bankRegister & 0x40) >> 6;
    u8 chrMode = (bankRegister & 0x80) >> 7;

    if (0 == r) {
      chrBank[4 * chrMode] = (val & 0xfe) * chrBankSize;
      chrBank[4 * chrMode + 1] = ((val & 0xfe) + 1) * chrBankSize;
    } else if (1 == r) {
      chrBank[4 * chrMode + 2] = (val & 0xfe) * chrBankSize;
      chrBank[4 * chrMode + 3] = ((val & 0xfe) + 1) * chrBankSize;
    } else if (2 == r) {
      chrBank[chrMode ? 0 : 4] = val * chrBankSize;
    } else if (3 == r) {
      chrBank[chrMode ? 1 : 5] = val * chrBankSize;
    } else if (4 == r) {
      chrBank[chrMode ? 2 : 6] = val * chrBankSize;
    } else if (5 == r) {
      chrBank[chrMode ? 3 : 7] = val * chrBankSize;
    } else if (6 == r) {
      prgBank[prgMode ? 2 : 0] = ((val & 0x3f) % prgBanksCount()) * prgBankSize;
      prgBank[prgMode ? 0 : 2] = (prgBanksCount() - 2) * prgBankSize;
    } else if (7 == r) {
      prgBank[1] = ((val & 0x3f) % prgBanksCount()) * prgBankSize;
    }
  }
  // nametable arrangement
  else if (addr >= 0xa000 && addr <= 0xbfff && (addr & 0x01) == 0) {
    if (!altNametableLayout) {
      mirroring = val & 0x01 ? Mirroring::Horizontal : Mirroring::Vertical;
    }
  }
  // irq latch
  else if (addr >= 0xc000 && addr <= 0xdfff && (addr & 0x01) == 0) {
    irqReloadValue = val;
  }
  // irq reload
  else if (addr >= 0xc000 && addr <= 0xdfff && (addr & 0x01) == 1) {
    irqCounter = 0;
  }
  // irq disable
  else if (addr >= 0xe000 && addr <= 0xffff && (addr & 0x01) == 0) {
    irq = false;
    irqEnabled = false;
  }
  // irq enable
  else if (addr >= 0xe000 && addr <= 0xffff && (addr & 0x01) == 1) {
    irqEnabled = true;
  }
}

u8 Mapper4::ppuRead(u16 addr) {
  if (addr >= 0x2000) {
    return Mapper::ppuRead(addr);
  }

  return chr[getCHRBank(addr) | (addr & 0x03ff)];
}

void Mapper4::ppuWrite(u16 addr, u8 val) {
  if (addr >= 0x2000) {
    return Mapper::ppuWrite(addr, val);
  }

  chr[getCHRBank(addr) | (addr & 0x03ff)] = val;
}

bool Mapper4::isIRQ() {
  bool f = irq;
  irq = false;

  return f;
}

void Mapper4::scanline() {
  if (irqCounter == 0) {
    irqCounter = irqReloadValue;
  } else {
    --irqCounter;
  }

  if (irqCounter == 0 && irqEnabled) {
    irq = true;
  }
}

u32 Mapper4::getCHRBank(u16 addr) {
  u32 bank = chrBank[7];

  if (addr < 0x0400)
    bank = chrBank[0];
  else if (addr < 0x0800)
    bank = chrBank[1];
  else if (addr < 0x0c00)
    bank = chrBank[2];
  else if (addr < 0x1000)
    bank = chrBank[3];
  else if (addr < 0x1400)
    bank = chrBank[4];
  else if (addr < 0x1800)
    bank = chrBank[5];
  else if (addr < 0x1c00)
    bank = chrBank[6];

  return bank;
}
