class Queue {
  constructor(size) {
    this.a = new Array(size).fill(0);
    this.i = 0;
    this.l = 0;
    this.v = 0;
  }

  push(v) {
    if (this.l < this.a.length) {
      this.a[(this.i + this.l++) % this.a.length] = v;
    }
  }

  pop() {
    if (this.l > 0) {
      --this.l;
      this.v = this.a[this.i++];
      this.i %= this.a.length;
    }

    return this.v;
  }
}

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.samples = new Queue(2048);

    this.port.onmessage = ({ data }) => {
      for (const d of data) {
        this.samples.push(d);
      }
    };
  }

  process(inputs, outputs) {
    const channel = outputs[0][0];

    for (let i = 0; i < channel.length; ++i) {
      channel[i] = this.samples.pop();
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
