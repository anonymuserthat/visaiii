// A detached template keeps remote images and scripts inert. Only its text is rendered.
export function emailHtmlToText(html: string): string {
  const template = document.createElement('template')
  template.innerHTML = html
  template.content.querySelectorAll('script,style,template,head,noscript,iframe,object,svg,img').forEach((node) => node.remove())
  template.content.querySelectorAll('br').forEach((node) => node.replaceWith('\n'))
  template.content.querySelectorAll('p,div,li,tr,h1,h2,h3,h4,blockquote').forEach((node) => node.append('\n'))
  return (template.content.textContent ?? '').replace(/\n[\t ]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function parseGoogleDesktopCredentials(json: string) {
  const value: unknown = JSON.parse(json)
  const installed = value && typeof value === 'object' && 'installed' in value ? value.installed : null
  if (!installed || typeof installed !== 'object' || !('client_id' in installed) || !('client_secret' in installed) ||
      typeof installed.client_id !== 'string' || typeof installed.client_secret !== 'string') {
    throw new Error('Importez le fichier JSON Google d’une application OAuth de bureau (Desktop app).')
  }
  return { clientId: installed.client_id, clientSecret: installed.client_secret }
}
