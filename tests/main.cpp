#include "../src/console/cpu/cpu-bus.h"
#include "../src/console/cpu/cpu.h"
#include <cstdint>
#include <emscripten/em_macros.h>

class TestCPUBus : public CPUBus {
public:
  uint8_t read(uint16_t addr) override { return ram[addr]; }

  void write(uint16_t addr, uint8_t val) override { ram[addr] = val; }

  void copyOAM(uint16_t addr) override {}

private:
  uint8_t ram[65536]{};
};

static CPU *cpu = nullptr;

static CPUBus *bus = nullptr;

extern "C" {
EMSCRIPTEN_KEEPALIVE
void cpuCreate(uint16_t *state, bool ignoreDMA) {
  delete bus;
  delete cpu;
  bus = new TestCPUBus();
  cpu =
      new CPU(bus, {state[0], state[1], state[2], state[3], state[4], state[5]},
              ignoreDMA);
}

EMSCRIPTEN_KEEPALIVE
uint16_t *cpuGetState() {
  static uint16_t stateArr[6]{};

  if (cpu) {
    CPU::State state = cpu->getState();
    stateArr[0] = state.a;
    stateArr[1] = state.x;
    stateArr[2] = state.y;
    stateArr[3] = state.p;
    stateArr[4] = state.s;
    stateArr[5] = state.pc;
  }

  return stateArr;
}

EMSCRIPTEN_KEEPALIVE
uint16_t cpuExecStart() {
  if (cpu) {
    return cpu->execStart();
  }

  return 0;
}

EMSCRIPTEN_KEEPALIVE
void cpuExecEnd() {
  if (cpu) {
    cpu->execEnd();
  }
}

EMSCRIPTEN_KEEPALIVE
void cpuEnableDecimalMode() {
  if (cpu) {
    cpu->enableDecimalMode();
  }
}

EMSCRIPTEN_KEEPALIVE
void cpuReset() {
  if (cpu) {
    cpu->reset();
  }
}

EMSCRIPTEN_KEEPALIVE
void cpuNMI() {
  if (cpu) {
    cpu->nmi();
  }
}

EMSCRIPTEN_KEEPALIVE
void cpuIRQ() {
  if (cpu) {
    cpu->irq();
  }
}

EMSCRIPTEN_KEEPALIVE
void cpuSetReadCb(void (*cb)(uint16_t, uint8_t)) {
  if (cpu) {
    cpu->setReadCb(cb);
  }
}

EMSCRIPTEN_KEEPALIVE
void cpuSetWriteCb(void (*cb)(uint16_t, uint8_t)) {
  if (cpu) {
    cpu->setWriteCb(cb);
  }
}

EMSCRIPTEN_KEEPALIVE
void cpuSetExecCb(void (*cb)()) {
  if (cpu) {
    cpu->setExecCb(cb);
  }
}

EMSCRIPTEN_KEEPALIVE
uint8_t busRead(uint16_t addr) {
  if (bus) {
    return bus->read(addr);
  }

  return 0;
}

EMSCRIPTEN_KEEPALIVE
void busWrite(uint16_t addr, uint8_t val) {
  if (bus) {
    bus->write(addr, val);
  }
}
}