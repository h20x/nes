#pragma once

#include "../bus.h"
#include <cstdint>

class DMC {
public:
  void tick(bool even = false);

  void register_(uint8_t reg, uint8_t val);

  uint8_t output();

  void start();

  void stop();

  void clearIRQ();

  bool isIRQ();

  bool hasRemainingBytes();

  void setBus(Bus *busPtr);

private:
  static constexpr uint8_t LT[16]{
      214, 190, 170, 160, 143, 127, 113, 107, 95, 80, 71, 64, 53, 42, 36, 27,
  };

  Bus *bus;

  bool stopped = true;

  bool irqEnabled = false;

  bool irq = false;

  bool loop = false;

  bool emptyBuffer = true;

  uint8_t outputVal = 0;

  uint8_t period = 0;

  uint8_t periodCounter = 0;

  uint16_t shifter = 0x8000;

  uint16_t baseAddr = 0xc000;

  uint16_t curAddr = 0;

  uint16_t length = 1;

  uint16_t bytesCounter = 0;

  uint8_t buffer = 0;

  void updateOutput();

  void fetchNextByte();
};
