export const dynamic = 'force-static'

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/marketing', '/latihanmengetik/'] },
    sitemap: 'https://pepepipi.id/sitemap.xml',
  }
}
