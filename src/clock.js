import { Callable } from "./callable.js";

/**
 * Implementation of the `clock()` native function.
 */
export class ClockFunction extends Callable {
  /**
   * @override
   * @returns
   */
  call() {
    return Date.now() / 1000;
  }

  /**
   * @override
   */
  arity() {
    return 0;
  }
}
