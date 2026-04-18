/// <reference path="../typings.d.ts" />

import fs from 'fs';
import path from 'path';
import { Bus } from '../src/console/bus';
import { CPU } from '../src/console/cpu';
import { TestBus } from './bus';
import { Logger } from './logger';

type CPUState = {
  pc: number;
  s: number;
  a: number;
  x: number;
  y: number;
  p: number;
};

type Memory = [number, number][];

type TestData = {
  name: string;
  initial: CPUState & { ram: Memory };
  final: CPUState & { ram: Memory };
  cycles: [number, number, string][];
};

global.DEV = true;

const DEBUG = process.argv[2] === 'd';

let logger: Logger | null = null;
let startTime = 0;

decimalTest();
interruptTest();
functionalTest();
singleStepTests();

function functionalTest(): void {
  const testName = 'functional test';
  const [cpu] = setupTest('6502_functional_test', 0x00, [
    [0xfffc, 0x00],
    [0xfffd, 0x04],
  ]);

  while (true) {
    const { pc } = cpu;

    cpu.execStart();
    cpu.execEnd();

    if (cpu.pc === pc) {
      break;
    }
  }

  console.log(`${cpu.pc === 0x3469 ? '++' : '--'} ${testName} (${getDur()})`);

  if (cpu.pc !== 0x3469) {
    logger?.writeFile(testName);
  }
}

function decimalTest(): void {
  const testName = 'decimal test';
  const [cpu] = setupTest('6502_decimal_test', 0x0200, [
    [0xfffc, 0x00],
    [0xfffd, 0x02],
  ]);

  while (true) {
    cpu.execStart();
    cpu.execEnd();

    if (cpu.pc === 0x025b) {
      break;
    }
  }

  console.log(`${cpu.a === 0 ? '++' : '--'} ${testName} (${getDur()})`);

  if (cpu.a !== 0) {
    logger?.writeFile(testName);
  }
}

function interruptTest(): void {
  const testName = 'interrupt test';
  const [cpu, bus] = setupTest('6502_interrupt_test', 0x0a, [
    [0xfffc, 0x00],
    [0xfffd, 0x04],
    [0xbffc, 0x00],
  ]);

  while (true) {
    const { pc } = cpu;

    cpu.execStart();
    cpu.execEnd();

    const port = bus.read(0xbffc);

    if (port & 0x02) {
      bus.write(0xbffc, port & ~0x02);
      cpu.nmi();
    } else if (port & 0x01) {
      !(cpu.p & 0x04) && bus.write(0xbffc, port & ~0x01);
      cpu.irq();
    }

    if (cpu.pc === pc) {
      break;
    }
  }

  console.log(`${cpu.pc === 0x06f5 ? '++' : '--'} ${testName} (${getDur()})`);

  if (cpu.pc !== 0x06f5) {
    logger?.writeFile(testName);
  }
}

function setupTest(
  testFile: string,
  startAddr: number,
  mem: Memory
): [CPU, Bus] {
  startTime = Date.now();

  const bus = new TestBus();
  const cpu = new CPU(bus);

  cpu.enableDecimalMode();

  let addr = startAddr;

  readBinFile(path.join(__dirname, `bin/${testFile}.bin`), (val) =>
    bus.write(addr++, val)
  );

  for (const [a, v] of mem) {
    bus.write(a, v);
  }

  cpu.reset();

  if (DEBUG) {
    logger = new Logger(cpu);
  }

  return [cpu, bus];
}

function readBinFile(path: string, cb: (byte: number) => void): void {
  const fd = fs.openSync(path, 'r');
  const buffer = Buffer.alloc(1);

  let bytesRead: number;

  do {
    bytesRead = fs.readSync(fd, buffer, 0, 1, null);

    if (bytesRead > 0) {
      cb(buffer[0]);
    }
  } while (bytesRead > 0);

  fs.closeSync(fd);
}

function getDur(): string {
  return ((Date.now() - startTime) / 1000).toFixed(2) + ' s';
}

function singleStepTests(): void {
  const startTime = Date.now();

  // prettier-ignore
  // official opcodes
  const opcodes = [
    '00', '01', '05', '06', '08', '09', '0a', '0d', '0e',
    '10', '11', '15', '16', '18', '19', '1d', '1e',
    '20', '21', '24', '25', '26', '28', '29', '2a', '2c', '2d', '2e',
    '30', '31', '35', '36', '38', '39', '3d', '3e',
    '40', '41', '45', '46', '48', '49', '4a', '4c', '4d', '4e',
    '50', '51', '55', '56', '58', '59', '5d', '5e',
    '60', '61', '65', '66', '68', '69', '6a', '6c', '6d', '6e',
    '70', '71', '75', '76', '78', '79', '7d', '7e',
    '81', '84', '85', '86', '88', '8a', '8c', '8d', '8e',
    '90', '91', '94', '95', '96', '98', '99', '9a', '9d',
    'a0', 'a1', 'a2', 'a4', 'a5', 'a6', 'a8', 'a9', 'aa', 'ac', 'ad', 'ae',
    'b0', 'b1', 'b4', 'b5', 'b6', 'b8', 'b9', 'ba', 'bc', 'bd', 'be',
    'c0', 'c1', 'c4', 'c5', 'c6', 'c8', 'c9', 'ca', 'cc', 'cd', 'ce',
    'd0', 'd1', 'd5', 'd6', 'd8', 'd9', 'dd', 'de',
    'e0', 'e1', 'e4', 'e5', 'e6', 'e8', 'e9', 'ea', 'ec', 'ed', 'ee',
    'f0', 'f1', 'f5', 'f6', 'f8', 'f9', 'fd', 'fe',
  ];

  for (const code of opcodes) {
    const fname = code + '.json';
    const data = readJSONFile(
      path.join(__dirname, `nes6502/v1/${fname}`)
    ) as TestData[];

    for (const d of data) {
      singleStepTest(d);
    }
  }

  const dur = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`++ single step tests (${dur} s)`);
}

function singleStepTest({ name, initial, final, cycles }: TestData): void {
  const bus = new TestBus();
  const cpu = new CPU(bus, initial, true);

  const logger = DEBUG ? new Logger(cpu) : null;

  for (const [addr, val] of initial.ram) {
    bus.write(addr, val);
  }

  const nCycles = cpu.execStart();
  cpu.execEnd();

  if (
    !compareCPUState(final, cpu) ||
    !compareMem(final.ram, bus) ||
    nCycles !== cycles.length
  ) {
    console.log(`\ntest: ${name}`);

    console.log('\ninitial');
    printCPUState(initial);
    printMem(initial.ram);

    console.log('\nfinal');
    printCPUState(final);
    printMem(final.ram);
    console.log(`cycles: ${cycles.length}`);

    console.log('\ncurrent');
    printCPUState(cpu);
    printMem(extractMem(final.ram, bus));
    console.log(`cycles: ${nCycles}`);

    logger?.writeFile(name);

    throw new Error('Test failed');
  }
}

function compareCPUState(a: CPUState, b: CPUState): boolean {
  return (
    a.a === b.a &&
    a.x === b.x &&
    a.y === b.y &&
    a.p === b.p &&
    a.s === b.s &&
    a.pc === b.pc
  );
}

function compareMem(mem: Memory, bus: Bus): boolean {
  for (const [addr, val] of mem) {
    if (bus.read(addr) !== val) {
      return false;
    }
  }

  return true;
}

function extractMem(mem: Memory, bus: Bus): Memory {
  return mem.map(([addr]) => [addr, bus.read(addr)]);
}

function printCPUState(s: CPUState): void {
  console.log(
    `pc: ${s.pc}, s: ${s.s}, a: ${s.a}, x: ${s.x}, y: ${s.y}, p: ${s.p}`
  );
}

function printMem(mem: Memory): void {
  let str = '';

  for (const [addr, val] of mem) {
    if (str) {
      str += ', ';
    }

    str += `[${addr}, ${val}]`;
  }

  console.log(str);
}

function readJSONFile(path: string): unknown {
  const data = fs.readFileSync(path, 'utf8');

  return JSON.parse(data);
}
