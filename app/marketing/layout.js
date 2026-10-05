// Halaman internal: jangan diindeks mesin pencari.
export const metadata = {
  robots: { index: false, follow: false },
}

export default function MarketingLayout({ children }) {
  return children
}
