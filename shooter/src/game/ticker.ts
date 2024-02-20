import { Writer } from "./data-writer";

export function ticker(rate: number, writer: Writer) {
  let next = Date.now() + rate;
  let previousNow = 0;

  return function tickRunner() {
    const now = Date.now();
    const interval = now - previousNow;

    if (previousNow !== 0) {
      writer.write("tickInterval", interval);
      if (interval > rate + 1) {
        writer.count("tickIntervalOverrun");
      } else if (interval < Math.floor(rate - 1)) {
        writer.count("tickIntervalUnderrun");
      } else {
        writer.count("tickOnTime");
      }
    }

    let flooredNext = Math.floor(next);
    if (now > flooredNext) {
      flooredNext = now + 1;
      next = flooredNext + rate;
    } else {
      next = next + rate;
    }
    previousNow = now;

    return flooredNext;
  };
}

type Callback = () => void;
// create a map of { timeInTheFuture: callbacksToHandle[] }
class Timer {
  private cbs: Map<number, Callback[]>;
  private lastUpdateTime: number;
  private boundRun: () => void;

  constructor() {
    this.cbs = new Map();
    this.lastUpdateTime = Date.now();
    this.boundRun = this.run.bind(this);
  }

  static create() {
    const timer = new Timer();
    timer.run();

    return timer;
  }

  // for this given callback, when in the future do you need to be called?
  add(cb: Callback, when: number) {
    let cbs = this.cbs.get(when);
    if (!cbs) {
      cbs = [];
      this.cbs.set(when, cbs);
    }
    cbs.push(cb);
  }

  // we're controlling when the process event loop should take control again
  private run() {
    const start = Date.now();

    while (this.lastUpdateTime < start) {
      // process only up to 2 milliseconds of data
      if (Date.now() - start > 2) {
        break;
      }

      const cbs = this.cbs.get(this.lastUpdateTime);
      if (cbs) {
        for (const cb of cbs) {
          cb();
        }
      }
      this.cbs.delete(this.lastUpdateTime);
      this.lastUpdateTime++;
    }

    setTimeout(this.boundRun, 0);
  }
}

const timer = Timer.create();

export function getTimer(): Timer {
  return timer;
}
