#include "apu.h"
#include "../bus.h"
#include <cstdint>

APU::APU() { pulse1 = Pulse(true); }

void APU::init() { mixer.init(); }

void APU::tick() {
  ++cycles;

  uint8_t q = frameCounter.tick();
  bool even = cycles % 2 == 0;

  pulse1.tick(q, even);
  pulse2.tick(q, even);
  triangle.tick(q);
  noise.tick(q, even);
  dmc.tick(even);

  if (cycles % 41 == 0) {
    mixer.mix(pulse1.output(), pulse2.output(), triangle.output(),
              noise.output(), dmc.output());
  }
}

uint8_t APU::register_(APURegister reg) {
  if (APURegister::Status == reg) {
    uint8_t status =
        (pulse1.isEnabled() ? 0x01 : 0) | (pulse2.isEnabled() ? 0x02 : 0) |
        (triangle.isEnabled() ? 0x04 : 0) | (noise.isEnabled() ? 0x08 : 0) |
        (dmc.hasRemainingBytes() ? 0x10 : 0) |
        (frameCounter.isIRQ() ? 0x40 : 0) | (dmc.isIRQ() ? 0x80 : 0);

    frameCounter.clearIRQ();

    return status;
  }

  return 0;
}

void APU::register_(APURegister reg, uint8_t val) {
  if (reg >= APURegister::Pulse10 && reg <= APURegister::Pulse13) {
    pulse1.register_(reg % 4, val);
  } else if (reg >= APURegister::Pulse20 && reg <= APURegister::Pulse23) {
    pulse2.register_(reg % 4, val);
  } else if (reg >= APURegister::Triangle0 && reg <= APURegister::Triangle3) {
    triangle.register_(reg % 4, val);
  } else if (reg >= APURegister::Noise0 && reg <= APURegister::Noise3) {
    noise.register_(reg % 4, val);
  } else if (reg >= APURegister::DMC0 && reg <= APURegister::DMC3) {
    dmc.register_(reg % 4, val);
  } else if (APURegister::Status == reg) {
    pulse1.setEnabled(val & 0x01);
    pulse2.setEnabled(val & 0x02);
    triangle.setEnabled(val & 0x04);
    noise.setEnabled(val & 0x08);
    dmc.clearIRQ();
    val & 0x10 ? dmc.start() : dmc.stop();
  } else if (APURegister::FrameCounterReg == reg) {
    frameCounter.setMode(val & 0x80);
    frameCounter.setInterruptInhibitFlag(val & 0x40);
    frameCounter.reset();

    if (val & 0x80) {
      pulse1.tick(2);
      pulse2.tick(2);
      triangle.tick(2);
      noise.tick(2);
    }
  }
}

void APU::reset() {
  cycles = 0;
  frameCounter = FrameCounter();
  pulse1 = Pulse(true);
  pulse2 = Pulse();
  triangle = Triangle();
  noise = Noise();
  dmc = DMC();
  mixer.reset();
}

bool APU::isIRQ() { return frameCounter.isIRQ() || dmc.isIRQ(); }

bool APU::isInited() { return mixer.isInited(); }

void APU::setBus(Bus *busPtr) { dmc.setBus(busPtr); }
