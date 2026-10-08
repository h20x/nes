#include "ppu-bus.h"
#include "../mapper/mapper.h"
#include <cstdint>

PPUBusImpl::PPUBusImpl(Mapper *mapper) : mapper(mapper) {}

uint8_t PPUBusImpl::read(uint16_t addr) {
  addr &= 0x3fff;

  if (mapper->ppuAddrMapped(addr)) {
    return mapper->ppuRead(addr);
  } else if (addr >= 0x3f00 && addr <= 0x3fff) {
    addr &= addr % 4 ? 0x1f : 0x00;

    return palette[addr];
  } else {
    throw "Unmapped address";
  }
}

void PPUBusImpl::write(uint16_t addr, uint8_t val) {
  addr &= 0x3fff;

  if (mapper->ppuAddrMapped(addr)) {
    mapper->ppuWrite(addr, val);
  } else if (addr >= 0x3f00 && addr <= 0x3fff) {
    addr &= addr % 4 ? 0x1f : 0x0f;
    palette[addr] = val;
  } else {
    throw "Unmapped address";
  }
}

void PPUBusImpl::scanline() { mapper->scanline(); }