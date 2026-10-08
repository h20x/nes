#include "mapper.h"
#include <cstdint>
#include <cstdlib>

using u8 = uint8_t;
using u16 = uint16_t;
using u32 = uint32_t;

Mapper::Mapper(u8 *prg_, u32 prgSize_, u8 *chr_, u32 chrSize_,
               Mirroring mirroring_, bool altNametableLayout_)
    : prg(prg_), prgSize(prgSize_), chr(chr_), chrSize(chrSize_),
      mirroring(mirroring_), altNametableLayout(altNametableLayout_) {
  prgBank[1] = (prgBanksCount() - 1) * prgBankSize;
  chrBank[1] = chrBankSize;

  if (chr == nullptr) {
    chrSize = 8192;
    chr = (uint8_t *)malloc(chrSize);
    chrAllocated = true;
  }
}

Mapper::~Mapper() {
  if (chrAllocated) {
    free(chr);
  }
}

u8 Mapper::cpuRead(u16 addr) {
  if (addr >= 0x8000 && addr <= 0xbfff) {
    return prg[prgBank[0] | (addr & 0x3fff)];
  }

  if (addr >= 0xc000 && addr <= 0xffff) {
    return prg[prgBank[1] | (addr & 0x3fff)];
  }

  return ram[addr - 0x4020];
}

void Mapper::cpuWrite(u16 addr, u8 val) { ram[addr - 0x4020] = val; }

bool Mapper::cpuAddrMapped(u16 addr) {
  return addr >= 0x4020 && addr <= 0xffff;
}

u8 Mapper::ppuRead(u16 addr) {
  if (addr < 0x1000) {
    return chr[chrBank[0] | (addr & 0x0fff)];
  }

  if (addr < 0x2000) {
    return chr[chrBank[1] | (addr & 0x0fff)];
  }

  return getNametable(addr)[addr & 0x03ff];
}

void Mapper::ppuWrite(u16 addr, u8 val) {
  if (addr < 0x1000) {
    chr[chrBank[0] | (addr & 0x0fff)] = val;
  } else if (addr < 0x2000) {
    chr[chrBank[1] | (addr & 0x0fff)] = val;
  } else {
    getNametable(addr)[addr & 0x03ff] = val;
  }
}

bool Mapper::ppuAddrMapped(u16 addr) {
  return addr >= 0x0000 && addr <= 0x3eff;
}

u8 Mapper::prgBanksCount() { return prgSize / prgBankSize; }

u8 Mapper::chrgBanksCount() { return chrSize / chrBankSize; }

bool Mapper::isIRQ() { return false; }

void Mapper::scanline() {}

u8 *Mapper::getNametable(u16 addr) {
  addr &= 0x0fff;

  if (Horizontal == mirroring) {
    return addr >= 0x0000 && addr <= 0x07ff ? nametable0 : nametable1;
  }

  if (Vertical == mirroring) {
    return (addr >= 0x0000 && addr <= 0x03ff) ||
                   (addr >= 0x0800 && addr <= 0x0bff)
               ? nametable0
               : nametable1;
  }

  if (SingleScreenLo == mirroring) {
    return nametable0;
  }

  if (SingleScreenHi == mirroring) {
    return nametable1;
  }

  if (addr < 0x0400) {
    return nametable0;
  }

  if (addr < 0x0800) {
    return nametable1;
  }

  if (addr < 0x0c00) {
    return nametable2;
  }

  return nametable3;
}
