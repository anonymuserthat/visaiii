import { useEffect, useId, useRef, useState } from 'react'
import { LoaderCircle, UserRound, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CurrentUserProfile } from '@/lib/api/types'
import {
  normalizeSubmitterEmail,
  normalizeSubmitterName,
} from '@/lib/request-records'

export function CurrentUserDialog({
  draft,
  onDraftChange,
  onSave,
  onClose,
}: {
  draft: CurrentUserProfile
  onDraftChange: (profile: CurrentUserProfile) => void
  onSave: (profile: CurrentUserProfile) => Promise<void>
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    dialog?.showModal()
    nameRef.current?.focus()
    return () => {
      dialog?.close?.()
      if (trigger?.isConnected) trigger.focus()
    }
  }, [])

  async function save() {
    if (saving) return
    const profile = {
      name: normalizeSubmitterName(draft.name),
      email: normalizeSubmitterEmail(draft.email),
    }
    const nextErrors = {
      name:
        profile.name.length < 2 ? 'Saisissez votre nom complet.' : undefined,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
        ? undefined
        : 'Saisissez une adresse e-mail valide.',
    }
    setErrors(nextErrors)
    setSaveError('')
    if (nextErrors.name || nextErrors.email) {
      ;(nextErrors.name ? nameRef : emailRef).current?.focus()
      return
    }
    setSaving(true)
    try {
      await onSave(profile)
    } catch {
      setSaveError(
        'Le profil n’a pas pu être enregistré. Vos modifications sont conservées. Réessayez.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="profile-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled)',
        )
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        if (!saving) onClose()
      }}
    >
      <form
        noValidate
        aria-busy={saving}
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <div className="profile-dialog-heading">
          <span className="profile-dialog-icon">
            <UserRound size={20} aria-hidden="true" />
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fermer le profil"
            disabled={saving}
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>
        <h2 id={`${id}-title`}>Votre profil</h2>
        <p id={`${id}-description`}>
          Ces coordonnées identifient l’auteur des demandes et préremplissent
          le contact principal.
        </p>
        <div className="profile-dialog-fields">
          <div className="space-y-1.5">
            <label htmlFor={`${id}-name`}>Nom complet</label>
            <Input
              ref={nameRef}
              id={`${id}-name`}
              autoComplete="name"
              disabled={saving}
              value={draft.name}
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${id}-name-error` : undefined}
              onChange={(event) =>
                onDraftChange({ ...draft, name: event.target.value })
              }
            />
            {errors.name ? (
              <p
                id={`${id}-name-error`}
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.name}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-email`}>Adresse e-mail</label>
            <Input
              ref={emailRef}
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              disabled={saving}
              value={draft.email}
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? `${id}-email-error` : undefined
              }
              onChange={(event) =>
                onDraftChange({ ...draft, email: event.target.value })
              }
            />
            {errors.email ? (
              <p
                id={`${id}-email-error`}
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.email}
              </p>
            ) : null}
          </div>
        </div>
        {saveError ? (
          <p role="alert" className="text-sm text-destructive">
            {saveError}
          </p>
        ) : null}
        <div className="dialog-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <LoaderCircle
                size={16}
                className="mr-2 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
