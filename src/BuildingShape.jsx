// The plain stone buildings of the town, in their seven shapes: block, slim tower, drum, arch,
// pyramid, dome and ziggurat. No doors, windows or roofs: just the shape. The sphere town
// (TownScene.jsx) and Going Cuckoo's city (CityScene.jsx) both use them.

import { FLOOR } from './town.js'

function Box({ p, s, colour }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={colour} roughness={0.8} />
    </mesh>
  )
}

// One building in one of its shapes, standing on 0 and reaching up to topOf(shape, floors).
export function Shape({ shape, floors, colour }) {
  const h = floors * FLOOR
  const material = <meshStandardMaterial color={colour} roughness={0.8} />
  switch (shape) {
    case 'tower':
      return (
        <>
          <Box p={[0, (h * 1.4) / 2, 0]} s={[1.1, h * 1.4, 1.1]} colour={colour} />
          <Box p={[0, h * 1.4 - 0.06, 0]} s={[1.35, 0.12, 1.35]} colour={colour} />
        </>
      )
    case 'drum':
      return (
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.95, 0.95, h, 40]} />
          {material}
        </mesh>
      )
    case 'arch': {
      const lintel = 0.45
      const leg = Math.max(0.2, h - lintel)
      return (
        <>
          <Box p={[-0.7, leg / 2, 0]} s={[0.5, leg, 1.5]} colour={colour} />
          <Box p={[0.7, leg / 2, 0]} s={[0.5, leg, 1.5]} colour={colour} />
          <Box p={[0, leg + lintel / 2, 0]} s={[1.9, lintel, 1.5]} colour={colour} />
        </>
      )
    }
    case 'pyramid':
      return (
        <mesh position={[0, h / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
          <coneGeometry args={[1.3, h, 4]} />
          <meshStandardMaterial color={colour} roughness={0.8} flatShading />
        </mesh>
      )
    case 'dome': {
      const drum = Math.max(0.15, h - 0.9)
      return (
        <>
          <mesh position={[0, drum / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.95, 0.95, drum, 40]} />
            {material}
          </mesh>
          <mesh position={[0, drum, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.95, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={colour} roughness={0.8} />
          </mesh>
        </>
      )
    }
    case 'ziggurat':
      return [1.9, 1.35, 0.8].map((w, i) => <Box key={i} p={[0, (h / 3) * (i + 0.5), 0]} s={[w, h / 3, w]} colour={colour} />)
    default: // block
      return <Box p={[0, h / 2, 0]} s={[1.9, h, 1.9]} colour={colour} />
  }
}
