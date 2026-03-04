import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FocusGuard - Analytics Dashboard',
  description: 'Track your focus time, detect distractions, and boost productivity with FocusGuard analytics',
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
