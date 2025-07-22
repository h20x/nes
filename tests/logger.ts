import fs from 'fs';
import path from 'path';
import { CPU } from '../src/cpu';

// prettier-ignore
export const INSTRUCTIONS = [
  'BRK imp 1', 'ORA ind,x 2', 'NOP imp 1', 'NOP imp 1', 'NOP imp 1',   'ORA zpg 2',   'ASL zpg 2',   'NOP imp 1', 'PHP imp 1', 'ORA imm 2',   'ASL acc 1',  'NOP imp 1', 'NOP imp 1',   'ORA abs 3',   'ASL abs 3',   'NOP imp 1',
  'BPL rel 2', 'ORA ind,y 2', 'NOP imp 1', 'NOP imp 1', 'NOP imp 1',   'ORA zpg,x 2', 'ASL zpg,x 2', 'NOP imp 1', 'CLC imp 1', 'ORA abs,y 3', 'NOP imp 1',  'NOP imp 1', 'NOP imp 1',   'ORA abs,x 3', 'ASL abs,x 3', 'NOP imp 1',
  'JSR abs 3', 'AND ind,x 2', 'NOP imp 1', 'NOP imp 1', 'BIT zpg 2',   'AND zpg 2',   'ROL zpg 2',   'NOP imp 1', 'PLP imp 1', 'AND imm 2',   'ROL acc 1',  'NOP imp 1', 'BIT abs 3',   'AND abs 3',   'ROL abs 3',   'NOP imp 1',
  'BMI rel 2', 'AND ind,y 2', 'NOP imp 1', 'NOP imp 1', 'NOP imp 1',   'AND zpg,x 2', 'ROL zpg,x 2', 'NOP imp 1', 'SEC imp 1', 'AND abs,y 3', 'NOP imp 1',  'NOP imp 1', 'NOP imp 1',   'AND abs,x 3', 'ROL abs,x 3', 'NOP imp 1',
  'RTI imp 1', 'EOR ind,x 2', 'NOP imp 1', 'NOP imp 1', 'NOP imp 1',   'EOR zpg 2',   'LSR zpg 2',   'NOP imp 1', 'PHA imp 1', 'EOR imm 2',   'LSR acc 1',  'NOP imp 1', 'JMP abs 3',   'EOR abs 3',   'LSR abs 3',   'NOP imp 1',
  'BVC rel 2', 'EOR ind,y 2', 'NOP imp 1', 'NOP imp 1', 'NOP imp 1',   'EOR zpg,x 2', 'LSR zpg,x 2', 'NOP imp 1', 'CLI imp 1', 'EOR abs,y 3', 'NOP imp 1',  'NOP imp 1', 'NOP imp 1',   'EOR abs,x 3', 'LSR abs,x 3', 'NOP imp 1',
  'RTS imp 1', 'ADC ind,x 2', 'NOP imp 1', 'NOP imp 1', 'NOP imp 1',   'ADC zpg 2',   'ROR zpg 2',   'NOP imp 1', 'PLA imp 1', 'ADC imm 2',   'ROR acc 1',  'NOP imp 1', 'JMP ind 3',   'ADC abs 3',   'ROR abs 3',   'NOP imp 1',
  'BVS rel 2', 'ADC ind,y 2', 'NOP imp 1', 'NOP imp 1', 'NOP imp 1',   'ADC zpg,x 2', 'ROR zpg,x 2', 'NOP imp 1', 'SEI imp 1', 'ADC abs,y 3', 'NOP imp 1',  'NOP imp 1', 'NOP imp 1',   'ADC abs,x 3', 'ROR abs,x 3', 'NOP imp 1',
  'NOP imp 1', 'STA ind,x 2', 'NOP imp 1', 'NOP imp 1', 'STY zpg 2',   'STA zpg 2',   'STX zpg 2',   'NOP imp 1', 'DEY imp 1', 'NOP imp 1',   'TXA imp 1',  'NOP imp 1', 'STY abs 3',   'STA abs 3',   'STX abs 3',   'NOP imp 1',
  'BCC rel 2', 'STA ind,y 2', 'NOP imp 1', 'NOP imp 1', 'STY zpg,x 2', 'STA zpg,x 2', 'STX zpg,y 2', 'NOP imp 1', 'TYA imp 1', 'STA abs,y 3', 'TXS imp 1',  'NOP imp 1', 'NOP imp 1',   'STA abs,x 3', 'NOP imp 1',   'NOP imp 1',
  'LDY imm 2', 'LDA ind,x 2', 'LDX imm 2', 'NOP imp 1', 'LDY zpg 2',   'LDA zpg 2',   'LDX zpg 2',   'NOP imp 1', 'TAY imp 1', 'LDA imm 2',   'TAX imp 1',  'NOP imp 1', 'LDY abs 3',   'LDA abs 3',   'LDX abs 3',   'NOP imp 1',
  'BCS rel 2', 'LDA ind,y 2', 'NOP imp 1', 'NOP imp 1', 'LDY zpg,x 2', 'LDA zpg,x 2', 'LDX zpg,y 2', 'NOP imp 1', 'CLV imp 1', 'LDA abs,y 3', 'TSX imp 1',  'NOP imp 1', 'LDY abs,x 3', 'LDA abs,x 3', 'LDX abs,y 3', 'NOP imp 1',
  'CPY imm 2', 'CMP ind,x 2', 'NOP imp 1', 'NOP imp 1', 'CPY zpg 2',   'CMP zpg 2',   'DEC zpg 2',   'NOP imp 1', 'INY imp 1', 'CMP imm 2',   'DEX imp 1',  'NOP imp 1', 'CPY abs 3',   'CMP abs 3',   'DEC abs 3',   'NOP imp 1',
  'BNE rel 2', 'CMP ind,y 2', 'NOP imp 1', 'NOP imp 1', 'NOP imp 1',   'CMP zpg,x 2', 'DEC zpg,x 2', 'NOP imp 1', 'CLD imp 1', 'CMP abs,y 3', 'NOP imp 1',  'NOP imp 1', 'NOP imp 1',   'CMP abs,x 3', 'DEC abs,x 3', 'NOP imp 1',
  'CPX imm 2', 'SBC ind,x 2', 'NOP imp 1', 'NOP imp 1', 'CPX zpg 2',   'SBC zpg 2',   'INC zpg 2',   'NOP imp 1', 'INX imp 1', 'SBC imm 2',   'NOP imp 1',  'NOP imp 1', 'CPX abs 3',   'SBC abs 3',   'INC abs 3',   'NOP imp 1',
  'BEQ rel 2', 'SBC ind,y 2', 'NOP imp 1', 'NOP imp 1', 'NOP imp 1',   'SBC zpg,x 2', 'INC zpg,x 2', 'NOP imp 1', 'SED imp 1', 'SBC abs,y 3', 'NOP imp 1',  'NOP imp 1', 'NOP imp 1',   'SBC abs,x 3', 'INC abs,x 3', 'NOP imp 1',
];

export class Logger {
  private log: string[] = new Array(this.size);

  private i: number = 0;

  constructor(cpu: CPU, private size: number = 1024) {
    this.log = new Array(size);

    cpu.onRead((addr, byte) => this.addLine(`r ${addr}W ${byte}B`));
    cpu.onWrite((addr, byte) => this.addLine(`w ${addr}W ${byte}B`));
    cpu.onExec(({ pc, s, a, x, y, p }) =>
      this.addLine(`pc ${pc}W | s ${s}B | a ${a}B | x ${x}B | y ${y}B | ${p}F`)
    );
  }

  writeFile(fname: string = 'cpu'): void {
    fname = fname.trim().replace(/\s+/g, '-') + '.log';

    try {
      fs.writeFileSync(
        path.join(__dirname, fname),
        this.getFileContent(),
        'utf8'
      );
      console.log(`${fname} written successfully`);
    } catch (err) {
      console.error(`Error writing ${fname}:`, err);
    }
  }

  private addLine(line: string): void {
    this.log[this.i++ % this.size] = line;
  }

  private getFileContent(): string {
    let lines = '';
    let isInst = false;

    for (let j = 0; j < this.size; ++j) {
      const idx = this.i++ % this.size;
      let line = this.log[idx];

      if (line) {
        line = this.convertLine(line);

        if (isInst) {
          line += ' ' + INSTRUCTIONS[parseInt(line.slice(-2), 16)];
        }

        isInst = line.startsWith('pc');

        lines += line + '\n';
      }
    }

    return lines;
  }

  private convertLine(line: string): string {
    return line
      .replace(/(\d+)W/g, (_, n) => this.hex(+n, 4))
      .replace(/(\d+)B/g, (_, n) => this.hex(+n))
      .replace(/(\d+)F/g, (_, n) => this.flags(+n));
  }

  private flags(p: number): string {
    return [
      p & (1 << 7) ? 'N' : '-',
      p & (1 << 6) ? 'V' : '-',
      p & (1 << 5) ? 'U' : '-',
      p & (1 << 4) ? 'B' : '-',
      p & (1 << 3) ? 'D' : '-',
      p & (1 << 2) ? 'I' : '-',
      p & (1 << 1) ? 'Z' : '-',
      p & (1 << 0) ? 'C' : '-',
    ].join('');
  }

  private hex(n: number, len: number = 2): string {
    return n.toString(16).padStart(len, '0');
  }
}
