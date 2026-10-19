import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RUNTIME_CONFIG } from '@/lib/config'
import { isTauriEnvironment } from '@/lib/utils'
import {
  clearCaptchaSettings, getCaptchaSettings, saveCaptchaSettings,
  type CaptchaSettings,
} from '@/lib/recaptcha/solver'

interface Props {
  onChange: (settings: CaptchaSettings) => void
  disabled: boolean
}

export function CaptchaSettingsPanel({ onChange, disabled }: Props) {
  const [settings, setSettings] = useState<CaptchaSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const desktop = isTauriEnvironment()

  useEffect(() => {
    if (!desktop) return
    let active = true
    void getCaptchaSettings().then((saved) => {
      if (active) { setSettings(saved); onChange(saved) }
    }).catch((reason: unknown) => { if (active) setError(String(reason)) })
    return () => { active = false }
  }, [desktop, onChange])

  async function save(forget = false) {
    if (!settings) return
    setBusy(true); setError(''); setNotice('')
    try {
      const saved = forget ? await clearCaptchaSettings() : await saveCaptchaSettings({
        ...settings,
      })
      setSettings(saved); onChange(saved)
      setNotice(forget ? 'Parametres locaux reinitialises. Une cle dans .env reste disponible.' : 'Configuration enregistree.')
    } catch (reason) { setError(String(reason)) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
      <p className="font-semibold">Resolution automatique avec 2Captcha</p>
      <p className="text-sm text-muted-foreground">
        Le logiciel resout le CAPTCHA juste avant la soumission. Chaque resolution utilise le solde de votre compte 2Captcha.
      </p>
      {!desktop ? <p className="text-sm">Ouvrez le logiciel Windows pour configurer 2Captcha.</p> : null}
      {desktop && RUNTIME_CONFIG.mockMode ? <p className="text-sm text-amber-700">Mode demonstration : aucune resolution payante ne sera lancee.</p> : null}
      {settings ? (
        <fieldset disabled={disabled || busy} className="space-y-3 disabled:opacity-60">
          <p className={settings.configured ? 'text-sm text-emerald-700' : 'text-sm text-amber-700'}>
            {settings.configured
              ? '2Captcha est actif automatiquement avec TWOCAPTCHA_API_KEY.'
              : 'TWOCAPTCHA_API_KEY est introuvable ou invalide dans .env.'}
          </p>
          <details className="space-y-3 text-sm">
            <summary className="cursor-pointer">Parametres du site</summary>
            <label className="block space-y-1"><span>URL de la page du CAPTCHA</span><Input value={settings.websiteUrl} onChange={(event) => setSettings({ ...settings, websiteUrl: event.target.value })} /></label>
            <label className="block space-y-1"><span>Cle publique reCAPTCHA du site</span><Input value={settings.siteKey} onChange={(event) => setSettings({ ...settings, siteKey: event.target.value })} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.invisible} onChange={(event) => setSettings({ ...settings, invisible: event.target.checked })} />reCAPTCHA invisible</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.enterprise} onChange={(event) => setSettings({ ...settings, enterprise: event.target.checked })} />reCAPTCHA Enterprise</label>
          </details>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void save()}>{busy ? 'Enregistrement...' : 'Enregistrer 2Captcha'}</Button>
            {settings.configured ? <Button type="button" variant="secondary" onClick={() => void save(true)}>Reinitialiser 2Captcha</Button> : null}
          </div>
        </fieldset>
      ) : null}
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      {notice ? <p role="status" className="text-sm text-emerald-700">{notice}</p> : null}
    </div>
  )
}
