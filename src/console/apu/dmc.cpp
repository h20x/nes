#include "dmc.h"
#include "../bus.h"
#include <cstdint>

void DMC::tick(bool even) {
  if (!even) {
    return;
  }

  --periodCounter;

  if (periodCounter > 0) {
    return;
  }

  periodCounter = period;

  if (!stopped) {
    updateOutput();
  }

  shifter >>= 1;

  if (shifter != 0x80) {
    return;
  }

  shifter = 0x8000;

  if (emptyBuffer) {
    stopped = true;

    return;
  }

  shifter |= buffer;
  stopped = false;
  emptyBuffer = true;

  if (bytesCounter == 0) {
    return;
  }

  fetchNextByte();

  if (bytesCounter > 0) {
    return;
  }

  if (loop) {
    start();
  } else {
    irq = irqEnabled;
  }
}

void DMC::register_(uint8_t reg, uint8_t val) {
  if (0 == reg) {
    irqEnabled = val & 0x80;
    irq = irqEnabled && irq;
    loop = val & 0x40;
    period = LT[val & 0x0f];
  } else if (1 == reg) {
    outputVal = val & 0x7f;
  } else if (2 == reg) {
    baseAddr = 0xc000 | (val << 6);
  } else if (3 == reg) {
    length = (val << 4) | 0x01;
  }
}

uint8_t DMC::output() { return outputVal; }

void DMC::start() {
  if (bytesCounter > 0) {
    return;
  }

  curAddr = baseAddr;
  bytesCounter = length;

  if (emptyBuffer) {
    fetchNextByte();
  }

  if (bytesCounter == 0) {
    irq = irqEnabled;
  }
}

void DMC::stop() { bytesCounter = 0; }

void DMC::clearIRQ() { irq = 0; }

bool DMC::isIRQ() { return irq; }

bool DMC::hasRemainingBytes() { return bytesCounter > 0; }

void DMC::setBus(Bus *busPtr) { bus = busPtr; }

void DMC::updateOutput() {
  if (shifter & 0x01 && outputVal <= 125) {
    outputVal += 2;
  } else if (!(shifter & 0x01) && outputVal >= 2) {
    outputVal -= 2;
  }
}

void DMC::fetchNextByte() {
  buffer = bus->read(curAddr++);
  emptyBuffer = false;

  if (curAddr == 0) {
    curAddr = 0x8000;
  }

  --bytesCounter;
}
