/** Current instant for server-side computations outside React render (lint: no impure calls in render). */
export const nowMs = (): number => Date.now();
