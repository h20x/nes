export class Sweep {
  private n: number;

  private period: number = 0;

  private periodCounter: number = 0;

  private shift: number = 0;

  private pulsePeriod: number = 0;

  private pulseTargetPeriod: number = 0;

  private enabled: number = 0;

  private negate: number = 0;

  private reload: number = 0;

  constructor(ch1: boolean = false) {
    this.n = +ch1;
  }

  tick(): void {
    if (this.periodCounter === 0 || this.reload) {
      if (this.periodCounter === 0 && this.isEnabled() && !this.isMuted()) {
        this.pulsePeriod = this.pulseTargetPeriod;
        this.updatePulseTargetPeriod();
      }

      this.reload = 0;
      this.periodCounter = this.period;
    } else {
      --this.periodCounter;
    }
  }

  isEnabled(): boolean {
    return Boolean(this.enabled && this.shift > 0);
  }

  isMuted(): boolean {
    return this.pulsePeriod < 0x08 || this.pulseTargetPeriod > 0x07ff;
  }

  getPulsePeriod(): number {
    return this.pulsePeriod;
  }

  setEnabled(v: number): void {
    this.enabled = v;
  }

  setPeriod(v: number): void {
    this.period = v;
  }

  setNegate(v: number): void {
    this.negate = v;
    this.updatePulseTargetPeriod();
  }

  setShift(v: number): void {
    this.shift = v;
    this.updatePulseTargetPeriod();
  }

  setReloadFlag(): void {
    this.reload = 1;
  }

  setPulsePeriod(v: number): void {
    this.pulsePeriod = v;
    this.updatePulseTargetPeriod();
  }

  private updatePulseTargetPeriod(): void {
    const c = this.pulsePeriod >> this.shift;
    this.pulseTargetPeriod = this.negate
      ? Math.max(0, this.pulsePeriod - c - this.n)
      : this.pulsePeriod + c;
  }
}
