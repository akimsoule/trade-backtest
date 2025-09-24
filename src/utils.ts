export function seededRandom(seed: number): () => number {
  // LCG parameters (Numerical Recipes)
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return (s & 0xffffffff) / 0x100000000;
  };
}

export function rollingMean(arr: number[], period: number): number[] {
  const res: number[] = new Array(arr.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= period) sum -= arr[i - period];
    if (i >= period - 1) res[i] = sum / period;
  }
  return res;
}

export function rollingStd(arr: number[], period: number): number[] {
  const res: number[] = new Array(arr.length).fill(NaN);
  const mean = rollingMean(arr, period);
  for (let i = 0; i < arr.length; i++) {
    if (i >= period - 1) {
      let v = 0;
      for (let j = i - period + 1; j <= i; j++) v += Math.pow(arr[j] - mean[i], 2);
      res[i] = Math.sqrt(v / period);
    }
  }
  return res;
}
