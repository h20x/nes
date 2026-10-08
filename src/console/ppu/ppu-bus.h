#pragma once

#include "../bus.h"
#include "../mapper/mapper.h"
#include <cstdint>

class PPUBus : public Bus {
public:
  virtual ~PPUBus() = default;

  virtual void scanline() = 0;
};

class PPUBusImpl : public PPUBus {
  uint8_t palette[32]{};

  Mapper *mapper;

public:
  PPUBusImpl(Mapper *mapper);

  uint8_t read(uint16_t addr) override;

  void write(uint16_t addr, uint8_t val) override;

  void scanline() override;
};
