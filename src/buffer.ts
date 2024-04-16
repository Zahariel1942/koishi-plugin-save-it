import type { Session } from "koishi";
export class Buffer {
  private _bufferLenght = 25;
  private buffer: Session[] = [];
  constructor(length: number) {
    this._bufferLenght = length;
  }

  public add(s: Session) {
    this.buffer.unshift(s);

    if (this.buffer.length > this._bufferLenght) {
      this.buffer = this.buffer.slice(-this._bufferLenght);
    }
  }

  public take(count: number = 1) {
    const result = this.buffer.slice(0, count);
    this.buffer = this.buffer.slice(count);
    return result;
  }

  public clear() {
    this.buffer = [];
  }
}
