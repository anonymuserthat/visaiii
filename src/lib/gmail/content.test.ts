import { describe, expect, it } from 'vitest'
import { emailHtmlToText, parseGoogleDesktopCredentials } from './content'

describe('Gmail content', () => {
  it('converts HTML mail to readable text and excludes active content and tracking images', () => {
    const html = '<style>hidden styles</style><script>unsafe()</script><p>Bonjour &amp; bienvenue<br>Votre rendez-vous</p><div>Confirme</div><img src="https://example.test/pixel"><iframe>unsafe frame</iframe>'
    expect(emailHtmlToText(html)).toBe('Bonjour & bienvenue\nVotre rendez-vous\nConfirme')
  })

  it('imports the Desktop app credentials from downloaded Google JSON', () => {
    expect(parseGoogleDesktopCredentials(JSON.stringify({ installed: {
      client_id: 'desktop.apps.googleusercontent.com', client_secret: 'example-secret',
    } }))).toEqual({ clientId: 'desktop.apps.googleusercontent.com', clientSecret: 'example-secret' })
  })

  it('rejects web app credentials and incomplete or malformed files', () => {
    for (const json of ['{', '{}', 'null', '{"web":{"client_id":"web","client_secret":"secret"}}', '{"installed":{"client_id":"desktop"}}']) {
      expect(() => parseGoogleDesktopCredentials(json)).toThrow()
    }
  })
})
