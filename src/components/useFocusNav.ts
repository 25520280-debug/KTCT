import { useEffect, type RefObject } from 'react'

const NEXT = ['ArrowDown', 'ArrowRight']
const PREV = ['ArrowUp', 'ArrowLeft']

// Chọn nút trong menu/popup bằng phím mũi tên, để chơi được hoàn toàn bằng bàn phím.
export default function useFocusNav(container: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const buttons = () => [...(container.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
    buttons()[0]?.focus()

    const onKey = (event: KeyboardEvent) => {
      const direction = NEXT.includes(event.key) ? 1 : PREV.includes(event.key) ? -1 : 0
      const list = buttons()
      if (direction === 0 || list.length === 0) return
      event.preventDefault()
      const current = list.indexOf(document.activeElement as HTMLButtonElement)
      const next = current === -1 ? 0 : (current + direction + list.length) % list.length
      list[next].focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [container])
}
