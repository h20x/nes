#include "sweep.h"
#include <cstdint>

Sweep::Sweep(bool ch1) { n = ch1; }

void Sweep::tick() {
  if (periodCounter == 0 || reload) {
    if (periodCounter == 0 && isEnabled() && !isMuted()) {
      pulsePeriod = pulseTargetPeriod;
      updatePulseTargetPeriod();
    }

    reload = false;
    periodCounter = period;
  } else {
    --periodCounter;
  }
}

bool Sweep::isEnabled() { return enabled && shift > 0; }

bool Sweep::isMuted() {
  return pulsePeriod < 0x08 || pulseTargetPeriod > 0x07ff;
}

uint16_t Sweep::getPulsePeriod() { return pulsePeriod; }

void Sweep::setEnabled(bool v) { enabled = v; }

void Sweep::setPeriod(uint8_t v) { period = v; }

void Sweep::setNegate(bool v) {
  negate = v;
  updatePulseTargetPeriod();
}

void Sweep::setShift(uint8_t v) {
  shift = v;
  updatePulseTargetPeriod();
}

void Sweep::setReloadFlag() { reload = true; }

void Sweep::setPulsePeriod(uint16_t v) {
  pulsePeriod = v;
  updatePulseTargetPeriod();
}

void Sweep::updatePulseTargetPeriod() {
  uint16_t c = pulsePeriod >> shift;

  if (negate) {
    pulseTargetPeriod = pulsePeriod >= c + n ? pulsePeriod - c - n : 0;
  } else {
    pulseTargetPeriod = pulsePeriod + c;
  }
}
