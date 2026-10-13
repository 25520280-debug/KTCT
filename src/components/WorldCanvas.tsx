import Phaser from 'phaser'
import { useEffect, useRef } from 'react'
import FactoryScene, { type CameraTransform, type WorldCallbacks, type WorldView } from '../world/FactoryScene'
import { VIEW } from '../world/layout'

interface Props extends WorldCallbacks {
  view: WorldView
}

// Gắn canvas Phaser vào khung và chuyển state mới cho scene mỗi lần React vẽ lại.
export default function WorldCanvas({ view, onNear, onInteract, onCameraTransform }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<FactoryScene | null>(null)
  const callbacks = useRef<WorldCallbacks>({ onNear, onInteract, onCameraTransform })
  callbacks.current = { onNear, onInteract, onCameraTransform }

  useEffect(() => {
    const scene = new FactoryScene(view, {
      onNear: (zone) => callbacks.current.onNear(zone),
      onInteract: (zone) => callbacks.current.onInteract(zone),
      onCameraTransform: (transform: CameraTransform) => callbacks.current.onCameraTransform(transform),
    })
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current!,
      width: VIEW.width,
      height: VIEW.height,
      backgroundColor: '#f3eee3',
      banner: false,
      audio: { noAudio: true },
      scale: { mode: Phaser.Scale.NONE },
      physics: { default: 'arcade' },
      scene,
    })
    sceneRef.current = scene
    return () => {
      sceneRef.current = null
      game.destroy(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    sceneRef.current?.apply(view)
  }, [view])

  return <div ref={hostRef} className="absolute inset-0" aria-hidden />
}
