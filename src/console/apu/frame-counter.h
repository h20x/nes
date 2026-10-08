#pragma once

#include <cstdint>

class FrameCounter {
public:
  uint8_t tick();

  void reset();

  void clearIRQ();

  bool isIRQ();

  void setMode(uint8_t v);

  void setInterruptInhibitFlag(bool v);

private:
  uint16_t value = 0;

  uint8_t mode = 0;

  bool irq = false;

  bool irqEnabled = false;
};
