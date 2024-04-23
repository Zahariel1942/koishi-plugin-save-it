import type { Session } from "koishi";
export class Buffer {
  private _bufferLenght = 25;
  private buffer: Session[] = [];
  constructor(length: number) {
    this._bufferLenght = length;
  }

  public add(s: Session) {
    this.buffer.push(s);

    if (this.buffer.length > this._bufferLenght) {
      this.buffer.shift();
    }
  }

  public take(count: number = 1) {
    const result = [];

    while (count-- > 0) {
      result.push(this.buffer.pop());
    }
    return result.reverse();
  }

  public clear() {
    this.buffer = [];
  }
}
