#include "console.h"
#include "apu/apu.h"
#include "controller.h"
#include "cpu/cpu-bus.h"
#include "cpu/cpu.h"
#include "mapper/mapper-factory.h"
#include "mapper/mapper.h"
#include "ppu/ppu-bus.h"
#include "ppu/ppu.h"
#include <cstdint>
#include <emscripten/console.h>

Console::Console(uint8_t *gameData_, uint32_t *imageData_, APU *apu_)
    : gameData(gameData_), imageData(imageData_), apu(apu_) {}

Console::~Console() {
  delete mapper;
  delete ppuBus;
  delete ppu;
  delete controller1;
  delete controller2;
  delete cpuBus;
  delete cpu;
}

void Console::init() {
  mapper = MapperFactory::create(gameData);

  if (!mapper) {
    return;
  }

  ppuBus = new PPUBusImpl(mapper);
  ppu = new PPU(ppuBus, imageData);
  controller1 = new Controller();
  controller2 = new Controller();
  cpuBus = new CPUBusImpl(ppu, apu, mapper, controller1, controller2);
  cpu = new CPU(cpuBus);
  cpu->reset();

  if (apu->isInited()) {
    apu->reset();
  } else {
    apu->init();
  }

  apu->setBus(cpuBus);
}

void Console::renderFrame() {
  if (!apu->isInited()) {
    return;
  }

  int done = 0;

  while (!done) {
    int cycles = cpu->execStart() - 1;

    while (cycles--) {
      apu->tick();
      done |= ppu->tick();
      done |= ppu->tick();
      done |= ppu->tick();
    }

    apu->tick();
    done |= ppu->tick();

    if (ppu->isNMI()) {
      cpu->nmi();
    }

    if (mapper->isIRQ() || apu->isIRQ()) {
      cpu->irq();
    }

    done |= ppu->tick();
    done |= ppu->tick();

    cpu->execEnd();

    if (ppu->isNMI()) {
      cpu->nmi();
    }
  }
}

void Console::pressButton(uint8_t btn) { controller1->pressButton(btn); }

void Console::releaseButton(uint8_t btn) { controller1->releaseButton(btn); }
