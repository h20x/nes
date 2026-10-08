#include "length-counter.h"

void LengthCounter::tick() {
  if (!halt && value > 0) {
    --value;
  }
}

bool LengthCounter::isMuted() { return value == 0; }

void LengthCounter::setEnabled(bool v) {
  enabled = v;

  if (!v) {
    value = 0;
  }
}

void LengthCounter::setHalt(bool v) { halt = v; }

void LengthCounter::setValue(uint8_t v) {
  if (enabled) {
    value = LT[v];
  }
}
