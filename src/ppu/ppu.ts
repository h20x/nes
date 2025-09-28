import { Bus } from '../bus';
import { Screen } from '../screen/screen';
import { PALETTE } from './palette';

export enum PPURegister {
  Ctrl,
  Mask,
  Status,
  OAMAddr,
  OAMData,
  Scroll,
  VRAMAddr,
  VRAMData,
}

class ShiftRegister {
  private lo: number = 0;

  private hi: number = 0;

  private offset: number = 15;

  get(offset: number = 0): number {
    offset = this.offset - (offset & 0x07);

    return ((this.lo >> offset) & 0x01) | (((this.hi >> offset) & 0x01) << 1);
  }

  set(lo: number, hi: number): void {
    this.offset = 15;
    this.lo = (this.lo << 8) | (lo & 0xff);
    this.hi = (this.hi << 8) | (hi & 0xff);
  }

  shift(): void {
    --this.offset;
  }
}

export class PPU {
  private cycle: number = 0;

  private scanline: number = 0;

  private readBuffer: number = 0;

  private nmi: boolean = false;

  private oddFrame: boolean = false;

  private registers: number[] = new Array(9).fill(0);

  private oam: number[] = new Array(256).fill(0);

  private store: number[] = new Array(4).fill(0);

  private curSprites: number[] = [];

  private nextSprites: number[] = [];

  private shifters: [ShiftRegister, ShiftRegister] = [
    new ShiftRegister(),
    new ShiftRegister(),
  ];

  private v: number = 0;

  private t: number = 0;

  private x: number = 0;

  private w: boolean = false;

  constructor(private bus: Bus, private screen: Screen) {}

  reset(): void {
    this.cycle = this.scanline = this.t = this.x = this.readBuffer = 0;
    this.registers[PPURegister.Ctrl] = this.registers[PPURegister.Mask] = 0;
    this.nmi = this.oddFrame = this.w = false;
  }

  isNMI(): boolean {
    const f = this.nmi;
    this.nmi = false;

    return f;
  }

  register(reg: PPURegister): number;
  register(reg: PPURegister, val: number): void;
  register(reg: PPURegister, val?: number): void | number {
    if (val == null) {
      if (PPURegister.Status === reg) {
        const status = this.registers[reg];
        this.registers[reg] &= 0x7f;
        this.w = false;

        return status;
      } else if (PPURegister.OAMData === reg) {
        return this.oam[this.registers[PPURegister.OAMAddr]];
      } else if (PPURegister.VRAMData === reg) {
        const val = this.bus.read(this.v);
        const buf = this.readBuffer;
        this.readBuffer = val;
        this.v += this.registers[PPURegister.Ctrl] & 0x04 ? 32 : 1;
        this.v &= 0x7fff;

        return buf;
      }

      return 0;
    }

    val &= 0xff;

    if (PPURegister.Ctrl === reg) {
      // enabling NMI when VBlank flag is set
      if (
        (this.registers[reg] ^ val) & 0x80 &&
        val & this.registers[PPURegister.Status] & 0x80
      ) {
        this.nmi = true;
      }

      this.t &= ~0x0c00;
      this.t |= (val & 0x03) << 10;
      this.registers[reg] = val;
    } else if (PPURegister.Mask === reg) {
      this.registers[reg] = val;
    } else if (PPURegister.OAMAddr === reg) {
      this.registers[reg] = val;
    } else if (PPURegister.OAMData === reg) {
      const addr = this.registers[PPURegister.OAMAddr];
      this.oam[addr] = val;
      this.registers[PPURegister.OAMAddr] = (addr + 1) & 0xff;
    } else if (PPURegister.Scroll === reg) {
      if (this.w) {
        this.t &= ~0x73e0;
        this.t |=
          ((val & 0x07) << 12) | ((val & 0x38) << 2) | ((val & 0xc0) << 2);
      } else {
        this.t &= ~0x1f;
        this.t |= (val & 0xf8) >> 3;
        this.x = val & 0x07;
      }

      this.w = !this.w;
    } else if (PPURegister.VRAMAddr === reg) {
      if (this.w) {
        this.t &= 0xff00;
        this.t |= val;
        this.v = this.t;
      } else {
        this.t &= 0x00ff;
        this.t |= val << 8;
        this.t &= 0x3fff;
      }

      this.w = !this.w;
    } else if (PPURegister.VRAMData === reg) {
      this.bus.write(this.v, val);
      this.v += this.registers[PPURegister.Ctrl] & 0x04 ? 32 : 1;
      this.v &= 0x7fff;
    }
  }

  tick(): number {
    if (
      this.isRenderingEnabled() &&
      (239 >= this.scanline || 261 === this.scanline)
    ) {
      if (
        (this.cycle >= 1 && 256 >= this.cycle) ||
        (this.cycle >= 321 && 336 >= this.cycle)
      ) {
        const r = this.cycle % 8;

        if (0 === r) {
          this.incHorPos();
        }

        if (1 === r) {
          this.reloadShifters();
          this.fetchBgTile();
        }

        if (this.cycle >= 1 && 256 >= this.cycle && 261 !== this.scanline) {
          this.drawPixel();
        }

        this.shifters[0].shift();
        this.shifters[1].shift();
      }

      if (65 === this.cycle && 261 !== this.scanline) {
        this.evaluateSprites();
      }

      if (256 === this.cycle) {
        this.incVerPos();
      }

      if (257 === this.cycle && 261 !== this.scanline) {
        this.fetchSprites();
      }

      // copy horizontal position from t to v
      if (257 === this.cycle) {
        this.v &= ~0x041f;
        this.v |= this.t & 0x041f;
      }

      // copy vertical position from t to v
      if (280 === this.cycle && 261 === this.scanline) {
        this.v &= ~0x7be0;
        this.v |= this.t & 0x7be0;
      }
    }

    // draw a transparent pixel
    if (
      !this.isRenderingEnabled() &&
      this.cycle >= 1 &&
      256 >= this.cycle &&
      239 >= this.scanline
    ) {
      this.screen.setPixel(
        this.cycle - 1,
        this.scanline,
        PALETTE[this.bus.read(0x3f00)]
      );
    }

    // set VBlank flag
    if (241 === this.scanline && 1 === this.cycle) {
      this.registers[PPURegister.Status] |= 0x80;

      if (this.registers[PPURegister.Ctrl] & 0x80) {
        this.nmi = true;
      }
    }

    // clear sprite overflow, sprite 0 hit, VBlank
    if (261 === this.scanline && 1 === this.cycle) {
      this.registers[PPURegister.Status] &= 0x1f;
      this.nmi = false;
    }

    if (340 === this.cycle) {
      this.cycle = 0;
      ++this.scanline;
    } else {
      ++this.cycle;
    }

    if (262 === this.scanline) {
      // skip 0 cycle
      if (this.oddFrame && this.isRenderingEnabled()) {
        this.cycle = 1;
      }

      this.scanline = 0;
      this.oddFrame = !this.oddFrame;
      this.screen.update();

      return 1;
    }

    return 0;
  }

  private isRenderingEnabled(): number {
    return this.registers[PPURegister.Mask] & 0x18;
  }

  private reloadShifters(): void {
    const attr = this.store[1];
    const x = ((this.v - 1) & 0x03) >> 1;
    const y = ((this.v >> 5) & 0x03) >> 1;
    const a = attr >> ((y << 2) | (x << 1));

    this.shifters[0].set(this.store[2], this.store[3]);
    this.shifters[1].set(a & 0x01 ? 0xff : 0, a & 0x02 ? 0xff : 0);
  }

  private fetchBgTile(): void {
    // tile index
    this.store[0] = this.bus.read(0x2000 | (this.v & 0x0fff));

    // tile attribute
    this.store[1] = this.bus.read(
      0x23c0 |
        (this.v & 0x0c00) |
        ((this.v >> 4) & 0x38) |
        ((this.v >> 2) & 0x07)
    );

    const addr = this.registers[PPURegister.Ctrl] & 0x10 ? 0x1000 : 0x0000;

    // tile low byte
    this.store[2] = this.bus.read(
      addr | (this.store[0] << 4) | ((this.v & 0x7000) >> 12)
    );

    // tile high byte
    this.store[3] = this.bus.read(
      addr | (this.store[0] << 4) | ((this.v & 0x7000) >> 12) | 0x08
    );
  }

  private drawPixel(): void {
    const x = this.cycle - 1;
    const y = this.scanline;

    const bgEnabled =
      this.registers[PPURegister.Mask] & 0x08 &&
      (this.registers[PPURegister.Mask] & 0x02 || x > 7);
    const sprEnabled =
      this.registers[PPURegister.Mask] & 0x10 &&
      (this.registers[PPURegister.Mask] & 0x04 || x > 7);

    let paletteIndex = this.shifters[1].get(this.x);
    let colorIndex = bgEnabled ? this.shifters[0].get(this.x) : 0;

    for (let i = 0; sprEnabled && i < this.curSprites.length; i += 6) {
      const xOffset = x - this.curSprites[i + 3];

      if (xOffset < 0 || xOffset > 7) {
        continue;
      }

      const lo = this.curSprites[i + 4];
      const hi = this.curSprites[i + 5];
      const hFlip = this.curSprites[i + 2] & 0x40;
      const offset = hFlip ? xOffset : 0x07 ^ xOffset;
      const colIndex = ((lo >> offset) & 0x01) | (((hi >> offset) & 0x01) << 1);

      if (0 === colIndex) {
        continue;
      }

      // sprite 0 hit
      if (
        0 === i &&
        0 !== colorIndex &&
        this.cycle < 256 &&
        this.curSprites[0] === this.oam[0] &&
        this.curSprites[3] === this.oam[3]
      ) {
        this.registers[PPURegister.Status] |= 0x40;
      }

      const priority = this.curSprites[i + 2] & 0x20;

      if (0 === colorIndex || (0 === priority && 0 !== colIndex)) {
        paletteIndex = 0x04 | (this.curSprites[i + 2] & 0x03);
        colorIndex = colIndex;
      }

      break;
    }

    let color = this.bus.read(0x3f00 | (paletteIndex << 2) | colorIndex);

    if (this.registers[PPURegister.Mask] & 0x01) {
      color &= 0x30;
    }

    this.screen.setPixel(x, y, PALETTE[color]);
  }

  private incHorPos(): void {
    if (31 === (this.v & 0x001f)) {
      this.v &= ~0x001f;
      this.v ^= 0x0400;
    } else {
      ++this.v;
    }
  }

  private incVerPos(): void {
    if ((this.v & 0x7000) != 0x7000) {
      this.v += 0x1000;
    } else {
      this.v &= ~0x7000;
      let y = (this.v & 0x03e0) >> 5;

      if (29 === y) {
        y = 0;
        this.v ^= 0x0800;
      } else if (31 === y) {
        y = 0;
      } else {
        ++y;
      }

      this.v = (this.v & ~0x03e0) | (y << 5);
    }
  }

  private evaluateSprites(): void {
    this.nextSprites.length = 0;
    const height = this.registers[PPURegister.Ctrl] & 0x20 ? 16 : 8;

    for (let i = 0; i < this.oam.length; i += 4) {
      if (
        this.scanline < this.oam[i] ||
        this.scanline >= this.oam[i] + height
      ) {
        continue;
      }

      // sprite overflow
      if (this.nextSprites.length >= 48) {
        this.registers[PPURegister.Status] |= 0x20;

        break;
      }

      this.nextSprites.push(
        this.oam[i],
        this.oam[i + 1],
        this.oam[i + 2],
        this.oam[i + 3],
        0,
        0
      );
    }
  }

  private fetchSprites(): void {
    // 8x16
    if (this.registers[PPURegister.Ctrl] & 0x20) {
      for (let i = 0; i < this.nextSprites.length; i += 6) {
        const vFlip = this.nextSprites[i + 2] & 0x80;
        const yOffset = this.scanline - this.nextSprites[i];
        let offset = yOffset % 8;
        let tileNum = (yOffset / 8) | 0;

        if (vFlip) {
          offset ^= 0x07;
          tileNum = (tileNum + 1) % 2;
        }

        let addr = this.nextSprites[i + 1] & 0x01 ? 0x1000 : 0x0000;
        addr |= (this.nextSprites[i + 1] & 0xfe) << 4;

        if (1 === tileNum) {
          addr |= 0x10;
        }

        this.nextSprites[i + 4] = this.bus.read(addr | offset);
        this.nextSprites[i + 5] = this.bus.read(addr | offset | 0x08);
      }
    }
    // 8x8
    else {
      const addr = this.registers[PPURegister.Ctrl] & 0x08 ? 0x1000 : 0x0000;

      for (let i = 0; i < this.nextSprites.length; i += 6) {
        const vFlip = this.nextSprites[i + 2] & 0x80;
        const yOffset = this.scanline - this.nextSprites[i];
        const offset = vFlip ? 0x07 ^ yOffset : yOffset;

        this.nextSprites[i + 4] = this.bus.read(
          addr | (this.nextSprites[i + 1] << 4) | offset
        );
        this.nextSprites[i + 5] = this.bus.read(
          addr | (this.nextSprites[i + 1] << 4) | offset | 0x08
        );
      }
    }

    this.curSprites = this.nextSprites.slice();
  }
}
