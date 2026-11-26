export const input = { x: 0, y: 0, yaw: Math.PI, sitReq: false, pitch: 0.28, keys: new Set<string>() }
export const HALF = { x: 12, z: 8 }
export const BENCHES: [number, number][] = [[-2.2, 2], [2.2, 2], [-2.2, 4.2], [2.2, 4.2]]
export const SEATS: [number, number][] = BENCHES.flatMap(([x, z]) => [[x - 0.7, z], [x + 0.7, z]] as [number, number][])
// obstacles as [centreX, centreZ, halfWidth, halfDepth]: benches and the cinema stage
export const OBSTACLES: [number, number, number, number][] = [...BENCHES.map(([x, z]) => [x, z, 1.6, 0.5] as [number, number, number, number]), [0, -1, 3.6, 0.7]]
export const myPos = { x: 0, z: 0, face: 0 }
export type Q = 'high' | 'medium' | 'low'
