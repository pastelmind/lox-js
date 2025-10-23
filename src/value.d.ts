import type { Callable } from "./callable.js";
import type { LoxInstance } from "./instance.js";

export type LoxValue =
  | Callable
  | LoxInstance
  | boolean
  | number
  | string
  | null;
