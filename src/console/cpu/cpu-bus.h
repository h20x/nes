#pragma once

#include "../apu/apu.h"
#include "../bus.h"
#include "../controller.h"
#include "../mapper/mapper.h"
#include "../ppu/ppu.h"
#include <cstdint>

class CPUBus : public Bus {
public:
  virtual ~CPUBus() = default;

  virtual void copyOAM(uint16_t addr) = 0;
};

class CPUBusImpl : public CPUBus {
public:
  CPUBusImpl(PPU *ppu, APU *apu, Mapper *mapper, Controller *controller1,
             Controller *controller2);

  uint8_t read(uint16_t addr) override;

  void write(uint16_t addr, uint8_t val) override;

  void copyOAM(uint16_t addr) override;

private:
  uint8_t ram[2048]{};

  PPU *ppu;

  APU *apu;

  Mapper *mapper;

  Controller *controller1;

  Controller *controller2;
};
