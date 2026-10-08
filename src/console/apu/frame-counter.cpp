#include "frame-counter.h"
#include <cstdint>

uint8_t FrameCounter::tick() {
  value += 1;
  uint8_t q = 0;

  if (7458 == value || 22372 == value) {
    q = 1;
  } else if (14916 == value) {
    q = 2;
  } else if (29831 == value && mode == 0) {
    irq = irqEnabled;
  } else if (29832 == value && mode == 0) {
    q = 4;
    irq = irqEnabled;
  } else if (29833 == value && mode == 0) {
    value = 3;
    irq = irqEnabled;
  } else if (37284 == value) {
    q = 4;
    value = 2;
  }

  return q;
}

void FrameCounter::reset() { value = 0; }

void FrameCounter::clearIRQ() { irq = false; }

bool FrameCounter::isIRQ() { return irq; }

void FrameCounter::setMode(uint8_t v) { mode = v; }

void FrameCounter::setInterruptInhibitFlag(bool v) {
  irqEnabled = !v;

  if (v) {
    irq = false;
  }
}
