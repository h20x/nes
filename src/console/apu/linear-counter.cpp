#include "linear-counter.h"
#include <cstdint>

void LinearCounter::tick() {
  if (reloadFlag) {
    value = reloadValue;
    reloadFlag = controlFlag;
  } else if (value > 0) {
    --value;
  }
}

bool LinearCounter::isMuted() { return value == 0; }

void LinearCounter::setReloadFlag() { reloadFlag = true; }

void LinearCounter::setReloadValue(uint8_t v) { reloadValue = v; }

void LinearCounter::setControlFlag(bool v) { controlFlag = v; }
