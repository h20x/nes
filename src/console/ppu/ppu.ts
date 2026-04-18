import { Screen } from '../screen';
import { PALETTE } from './palette';
import { PPUBus } from './ppu-bus';

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

export class PPU {
  private static RENDERING_TOGGLE_DELAY = 4;

  private cycle: number = 0;

  private scanline: number = 0;

  private readBuffer: number = 0;

  private cyclesTotal: number = 0;

  private nmi: boolean = false;

  private oddFrame: boolean = false;

  private renderingEnabled: boolean = false;

  private renderingChangeCycle: number = 0;

  private statusRegisterReadCycle: number = 0;

  private vblFlagSetCycle: number = 0;

  private registers: Uint8Array = new Uint8Array(9);

  private oam: Uint8Array = new Uint8Array(256);

  private store: Uint8Array = new Uint8Array(3);

  private currSprites: Uint8Array = new Uint8Array(48);

  private nextSprites: Uint8Array = new Uint8Array(48);

  private currSpritesLen: number = 0;

  private nextSpritesLen: number = 0;

  private tileShifter: number = 0;

  private attrShifter: number = 0;

  private v: number = 0;

  private t: number = 0;

  private x: number = 0;

  private w: boolean = false;

  constructor(private bus: PPUBus, private screen: Screen) {}

  reset(): void {
    this.cycle =
      this.scanline =
      this.readBuffer =
      this.cyclesTotal =
      this.renderingChangeCycle =
      this.statusRegisterReadCycle =
      this.vblFlagSetCycle =
      this.currSpritesLen =
      this.nextSpritesLen =
      this.tileShifter =
      this.attrShifter =
      this.v =
      this.t =
      this.x =
        0;

    this.nmi = this.oddFrame = this.renderingEnabled = this.w = false;

    this.registers = new Uint8Array(9);
    this.oam = new Uint8Array(256);
    this.store = new Uint8Array(3);
    this.currSprites = new Uint8Array(48);
    this.nextSprites = new Uint8Array(48);
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

        this.statusRegisterReadCycle = this.cyclesTotal;
        this.registers[reg] &= 0x7f;
        this.w = false;

        const diff = this.cyclesTotal - this.vblFlagSetCycle;

        if (diff === 0 || diff === 1) {
          this.nmi = false;
        }

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
        val & this.registers[PPURegister.Status] & 0x80 &&
        this.cycle !== 0
      ) {
        this.nmi = true;
      }

      if (!(val & 0x80)) {
        this.nmi = false;
      }

      this.t &= ~0x0c00;
      this.t |= (val & 0x03) << 10;
      this.registers[reg] = val;
    } else if (PPURegister.Mask === reg) {
      const re = !!(val & 0x18);

      if (this.renderingEnabled !== re) {
        this.renderingChangeCycle = this.cyclesTotal;
      }

      this.registers[reg] = val;
      this.renderingEnabled = re;
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
    ++this.cyclesTotal;

    const diff = this.cyclesTotal - this.renderingChangeCycle;
    const renEnabled =
      (this.renderingEnabled && diff >= PPU.RENDERING_TOGGLE_DELAY) ||
      (!this.renderingEnabled && diff < PPU.RENDERING_TOGGLE_DELAY);

    if (renEnabled && (239 >= this.scanline || 261 === this.scanline)) {
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

        this.tileShifter <<= 2;
        this.attrShifter <<= 2;
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

      if (260 === this.cycle) {
        this.bus.scanline();
      }

      // copy vertical position from t to v
      if (280 === this.cycle && 261 === this.scanline) {
        this.v &= ~0x7be0;
        this.v |= this.t & 0x7be0;
      }
    }

    // draw a transparent pixel
    if (
      !renEnabled &&
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

    // set VBlank flag if $2002 wasn't read one PPU cycle ago
    if (
      241 === this.scanline &&
      0 === this.cycle &&
      this.cyclesTotal - this.statusRegisterReadCycle !== 1
    ) {
      this.vblFlagSetCycle = this.cyclesTotal;
      this.registers[PPURegister.Status] |= 0x80;

      if (this.registers[PPURegister.Ctrl] & 0x80) {
        this.nmi = true;
      }
    }

    // clear sprite overflow, sprite 0 hit, VBlank
    if (261 === this.scanline && 0 === this.cycle) {
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
      if (this.oddFrame && renEnabled) {
        this.cycle = 1;
      }

      this.scanline = 0;
      this.oddFrame = !this.oddFrame;
      this.screen.update();

      return 1;
    }

    return 0;
  }

  private reloadShifters(): void {
    const [attr, lo, hi] = this.store;
    const x = ((this.v - 1) & 0x03) >> 1;
    const y = ((this.v >> 5) & 0x03) >> 1;
    const a = attr >> ((y << 2) | (x << 1));

    this.tileShifter |=
      ((hi & 0x80) << 8) |
      ((lo & 0x80) << 7) |
      ((hi & 0x40) << 7) |
      ((lo & 0x40) << 6) |
      ((hi & 0x20) << 6) |
      ((lo & 0x20) << 5) |
      ((hi & 0x10) << 5) |
      ((lo & 0x10) << 4) |
      ((hi & 0x08) << 4) |
      ((lo & 0x08) << 3) |
      ((hi & 0x04) << 3) |
      ((lo & 0x04) << 2) |
      ((hi & 0x02) << 2) |
      ((lo & 0x02) << 1) |
      ((hi & 0x01) << 1) |
      ((lo & 0x01) << 0);

    this.attrShifter |=
      a & 0x01 && a & 0x02
        ? 0xffff
        : a & 0x01 && !(a & 0x02)
        ? 0x5555
        : !(a & 0x01) && a & 0x02
        ? 0xaaaa
        : 0;
  }

  private fetchBgTile(): void {
    // tile index
    const idx = this.bus.read(0x2000 | (this.v & 0x0fff));

    // tile attribute
    this.store[0] = this.bus.read(
      0x23c0 |
        (this.v & 0x0c00) |
        ((this.v >> 4) & 0x38) |
        ((this.v >> 2) & 0x07)
    );

    const addr = this.registers[PPURegister.Ctrl] & 0x10 ? 0x1000 : 0x0000;

    // tile low byte
    this.store[1] = this.bus.read(
      addr | (idx << 4) | ((this.v & 0x7000) >> 12)
    );

    // tile high byte
    this.store[2] = this.bus.read(
      addr | (idx << 4) | ((this.v & 0x7000) >> 12) | 0x08
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

    let paletteIndex = (this.attrShifter >> (30 - (this.x << 1))) & 0x03;
    let colorIndex = bgEnabled
      ? (this.tileShifter >> (30 - (this.x << 1))) & 0x03
      : 0;

    for (let i = 0; sprEnabled && i < this.currSpritesLen; i += 6) {
      const xOffset = x - this.currSprites[i + 3];

      if (xOffset < 0 || xOffset > 7) {
        continue;
      }

      const lo = this.currSprites[i + 4];
      const hi = this.currSprites[i + 5];
      const hFlip = this.currSprites[i + 2] & 0x40;
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
        this.currSprites[0] === this.oam[0] &&
        this.currSprites[3] === this.oam[3]
      ) {
        this.registers[PPURegister.Status] |= 0x40;
      }

      const priority = this.currSprites[i + 2] & 0x20;

      if (0 === colorIndex || (0 === priority && 0 !== colIndex)) {
        paletteIndex = 0x04 | (this.currSprites[i + 2] & 0x03);
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
    const height = this.registers[PPURegister.Ctrl] & 0x20 ? 16 : 8;
    let l = 0;

    for (let i = 0; i < this.oam.length; i += 4) {
      if (
        this.scanline < this.oam[i] ||
        this.scanline >= this.oam[i] + height
      ) {
        continue;
      }

      // sprite overflow
      if (l === 48) {
        this.registers[PPURegister.Status] |= 0x20;

        break;
      }

      this.nextSprites[l] = this.oam[i];
      this.nextSprites[l + 1] = this.oam[i + 1];
      this.nextSprites[l + 2] = this.oam[i + 2];
      this.nextSprites[l + 3] = this.oam[i + 3];

      l += 6;
    }

    this.nextSpritesLen = l;
  }

  private fetchSprites(): void {
    // 8x16
    if (this.registers[PPURegister.Ctrl] & 0x20) {
      for (let i = 0; i < this.nextSpritesLen; i += 6) {
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

      for (let i = 0; i < this.nextSpritesLen; i += 6) {
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

    const t = this.currSprites;
    this.currSprites = this.nextSprites;
    this.nextSprites = t;
    this.currSpritesLen = this.nextSpritesLen;
    this.nextSpritesLen = 0;
  }
}
