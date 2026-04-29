class Queue {
  constructor(size) {
    this.a = new Array(size).fill(0);
    this.i = 0;
    this.l = 0;
    this.v = 0;
  }

  fill(input) {
    for (const v of input) {
      if (this.l < this.a.length) {
        this.a[(this.i + this.l++) % this.a.length] = v;
      }
    }
  }

  drain(output) {
    for (let i = 0; i < output.length; ++i) {
      if (this.l > 0) {
        --this.l;
        this.v = this.a[this.i++];
        this.i %= this.a.length;
      }

      output[i] = this.v;
    }
  }
}

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.samples = new Queue(2048);
    this.port.onmessage = ({ data }) => this.samples.fill(data);
  }

  process(inputs, outputs) {
    return this.samples.drain(outputs[0][0]), true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
