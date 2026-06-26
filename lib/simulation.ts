export function gaussianPlume(
  x: number, y: number, z: number,
  Q: number, u: number, sigmaY: number, sigmaZ: number
): number {
  if (x <= 0) return 0;
  const expY = Math.exp(-(y ** 2) / (2 * sigmaY ** 2));
  const expZ = Math.exp(-(z ** 2) / (2 * sigmaZ ** 2));
  return (Q / (2 * Math.PI * sigmaY * sigmaZ * u)) * expY * expZ;
}

export function dispersionParams(x: number): { sigmaY: number; sigmaZ: number } {
  const sigmaY = 0.22 * x * (1 + 0.0001 * x) ** -0.5;
  const sigmaZ = 0.20 * x * (1 + 0.0001 * x) ** -0.5;
  return { sigmaY, sigmaZ };
}

export function generateDispersionData(
  Q: number, u: number, z: number, maxDistance: number
): Array<{ x: number; y: number; concentration: number }> {
  const data: Array<{ x: number; y: number; concentration: number }> = [];
  const step = 50;
  for (let x = step; x <= maxDistance; x += step) {
    const { sigmaY, sigmaZ } = dispersionParams(x);
    for (let y = -maxDistance / 2; y <= maxDistance / 2; y += step) {
      const concentration = gaussianPlume(x, y, z, Q, u, sigmaY, sigmaZ);
      if (concentration > 1e-9) data.push({ x, y, concentration });
    }
  }
  return data;
}
