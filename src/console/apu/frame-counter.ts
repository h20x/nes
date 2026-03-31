enum Frame {
  Q1 = 3729,
  Q2 = 11186,
  H = 7457,
  F1 = 14916,
  F2 = 18640,
}

export class FrameCounter {
  private maxValue: number = Frame.F1;

  private value: number = 0;

  private mode: number = 0;

  private irq: boolean = false;

  private irqEnabled: boolean = false;

  tick(): number {
    this.value += 1;
    let q = 0;

    if (this.maxValue === this.value) {
      q = 4;
      this.value = 0;
      this.irq = this.irqEnabled && !this.mode;
    } else if (Frame.H === this.value) {
      q = 2;
    } else if (Frame.Q1 === this.value || Frame.Q2 === this.value) {
      q = 1;
    }

    return q;
  }

  reset(): void {
    this.value = 0;
  }

  clearIRQ(): void {
    this.irq = false;
  }

  isIRQ(): boolean {
    return this.irq;
  }

  setMode(v: number): void {
    this.mode = v;
    this.maxValue = v ? Frame.F2 : Frame.F1;
  }

  setInterruptInhibitFlag(v: number): void {
    this.irqEnabled = !v;

    if (v) {
      this.irq = false;
    }
  }
}
