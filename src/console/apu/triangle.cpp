#include "triangle.h"
#include <cstdint>

void Triangle::tick(uint8_t q) {
  if (q > 0) {
    linearCounter.tick();
  }

  if (q > 1) {
    lengthCounter.tick();
  }

  if (lengthCounter.isMuted() || linearCounter.isMuted() || period < 2) {
    return;
  }

  if (periodCounter == 0) {
    outputUnit.set(SEQ[sequencer]);
    periodCounter = period;
    sequencer = (sequencer + 1) % 32;
  } else {
    --periodCounter;
  }
}

void Triangle::register_(uint8_t reg, uint8_t val) {
  if (0 == reg) {
    lengthCounter.setHalt(val & 0x80);
    linearCounter.setControlFlag(val & 0x80);
    linearCounter.setReloadValue(val & 0x7f);
  } else if (2 == reg) {
    period = (period & ~0xff) | val;
  } else if (3 == reg) {
    period = (period & ~0x700) | ((val & 0x07) << 8);
    lengthCounter.setValue((val >> 3) & 0x1f);
    linearCounter.setReloadFlag();
  }
}

uint8_t Triangle::output() { return outputUnit.get(); }

bool Triangle::isEnabled() { return !lengthCounter.isMuted(); }

void Triangle::setEnabled(bool v) { lengthCounter.setEnabled(v); }
