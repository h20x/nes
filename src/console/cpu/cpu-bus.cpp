#include "cpu-bus.h"
#include "../apu/apu.h"
#include "../controller.h"
#include "../mapper/mapper.h"
#include "../ppu/ppu.h"
#include <cstdint>

CPUBusImpl::CPUBusImpl(PPU *ppu_, APU *apu_, Mapper *mapper_,
                       Controller *controller1_, Controller *controller2_)
    : ppu(ppu_), apu(apu_), mapper(mapper_), controller1(controller1_),
      controller2(controller2_) {}

uint8_t CPUBusImpl::read(uint16_t addr) {
  if (mapper->cpuAddrMapped(addr)) {
    return mapper->cpuRead(addr);
  } else if (addr >= 0x0000 && addr <= 0x1fff) {
    return ram[addr & 0x07ff];
  } else if (addr >= 0x2000 && addr <= 0x3fff) {
    return ppu->register_((PPU::PPURegister)(addr & 0x07));
  } else if (addr >= 0x4000 && addr <= 0x4017) {
    if (addr == 0x4015) {
      return apu->register_((APU::APURegister)0x15);
    }

    if (addr == 0x4016) {
      return controller1->read();
    }

    if (addr == 0x4017) {
      return controller2->read();
    }

    return 0;
  } else if (addr >= 0x4018 && addr <= 0x401f) {
    return 0;
  } else {
    throw "Unmapped address";
  }
}

void CPUBusImpl::write(uint16_t addr, uint8_t val) {
  if (mapper->cpuAddrMapped(addr)) {
    mapper->cpuWrite(addr, val);
  } else if (addr >= 0x0000 && addr <= 0x1fff) {
    ram[addr & 0x07ff] = val;
  } else if (addr >= 0x2000 && addr <= 0x3fff) {
    ppu->register_((PPU::PPURegister)(addr & 0x07), val);
  } else if (addr >= 0x4000 && addr <= 0x4017) {
    apu->register_((APU::APURegister)(addr & 0x1f), val);
  } else if (addr >= 0x4018 && addr <= 0x401f) {
  } else {
    throw "Unmapped address";
  }
}

void CPUBusImpl::copyOAM(uint16_t addr) {
  uint8_t *source = addr >= 0x0000 && addr <= 0x1fff ? ram : mapper->ram;

  for (uint16_t i = 0; i < 256; ++i) {
    ppu->oam[i] = source[addr + i];
  }
}
