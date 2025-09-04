import type { Callable } from "./callable.js";

export type LoxValue = Callable | boolean | number | string | null;
