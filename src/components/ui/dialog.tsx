import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Native modal behavior supplies focus containment, Escape, and focus restoration.
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="workspace-dialog"
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="workspace-dialog-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose()
        }
      }}
    >
      <header>
        <h2 id="workspace-dialog-title">{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Fermer"
          onClick={onClose}
        >
          <X size={18} />
        </Button>
      </header>
      <div className="workspace-dialog-content">{children}</div>
    </dialog>
  )
}
