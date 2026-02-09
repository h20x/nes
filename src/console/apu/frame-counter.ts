export class FrameCounter {
  private value: number = 0;

  private mode: number = 0;

  private maxValue: number = 14914;

  private irq: boolean = false;

  private irqEnabled: boolean = false;

  tick(): number {
    this.value = (this.value + 1) % (this.maxValue + 1);
    let q = 0;

    if (this.maxValue === this.value) {
      q = 4;
      this.irq = this.irqEnabled && !this.mode;
    } else if (7456 === this.value) {
      q = 2;
    } else if (3728 === this.value || 11185 === this.value) {
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
    this.maxValue = v ? 18640 : 14914;
  }

  setInterruptInhibitFlag(v: number): void {
    this.irqEnabled = !v;

    if (v) {
      this.irq = false;
    }
  }
}
