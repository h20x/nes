#include "pulse.h"
#include <cstdint>

Pulse::Pulse(bool ch1) { sweep = Sweep(ch1); }

void Pulse::tick(uint8_t q, bool even) {
  if (q > 0) {
    envelope.tick();
  }

  if (q > 1) {
    counter.tick();
    sweep.tick();
  }

  if (!even) {
    return;
  }

  if (periodCounter == 0) {
    outputUnit.set(sweep.isMuted() || counter.isMuted()
                       ? 0
                       : envelope.getVolume() * LT[dutySeq][sequencer]);

    periodCounter = sweep.getPulsePeriod();
    sequencer = (sequencer + 1) % 8;
  } else {
    --periodCounter;
  }
}

void Pulse::register_(uint8_t reg, uint8_t val) {
  if (0 == reg) {
    dutySeq = (val >> 6) & 0x03;
    counter.setHalt(val & 0x20);
    envelope.setLoop(val & 0x20);
    envelope.setConstVolumeMode(val & 0x10);
    envelope.setVolume(val & 0x0f);
  } else if (1 == reg) {
    sweep.setEnabled(val & 0x80);
    sweep.setPeriod((val >> 4) & 0x07);
    sweep.setNegate(val & 0x08);
    sweep.setShift(val & 0x07);
    sweep.setReloadFlag();
  } else if (2 == reg) {
    period = (period & ~0xff) | val;
    sweep.setPulsePeriod(period);
  } else if (3 == reg) {
    sequencer = 0;
    period = (period & ~0x0700) | ((val & 0x07) << 8);
    sweep.setPulsePeriod(period);
    counter.setValue((val >> 3) & 0x1f);
    envelope.setStartFlag();
  }
}

uint8_t Pulse::output() { return outputUnit.get(); }

bool Pulse::isEnabled() { return !counter.isMuted(); }

void Pulse::setEnabled(bool v) { counter.setEnabled(v); }
