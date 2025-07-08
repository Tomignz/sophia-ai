import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'

function ParticleSphere({ isTalking }) {
  const mesh = useRef()
  const [positions] = useState(() => {
    const temp = []
    const radius = 2
    const count = 10000
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = 2 * Math.PI * Math.random()
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)
      temp.push(x, y, z)
    }
    return new Float32Array(temp)
  })

  useFrame(({ clock }) => {
    if (mesh.current) {
      const t = clock.getElapsedTime()
      mesh.current.rotation.y += 0.002
      const scale = isTalking
        ? 1.2 + Math.sin(t * 5) * 0.05
        : 1 + Math.sin(t * 2) * 0.02
      mesh.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#00ffff" // cian constante
        transparent
        opacity={isTalking ? 1 : 0.7}
      />
    </points>
  )
}

export default function SophiaParticles({ isTalking }) {
  return (
    <Canvas className="absolute inset-0 z-0" camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.3} />
      <ParticleSphere isTalking={isTalking} />
    </Canvas>
  )
}

