'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push('/protected')
      }
    }

    checkAuth()
  }, [router])

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-text-balance">
            Welcome to <span className="text-accent">FocusGuard</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Track your focus time, detect distractions, and boost productivity with intelligent analytics
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-card rounded-lg border border-border">
            <h3 className="font-semibold text-lg mb-2">Real-time Tracking</h3>
            <p className="text-muted-foreground">Monitor your browsing behavior and focus patterns in real-time</p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border">
            <h3 className="font-semibold text-lg mb-2">Smart Analytics</h3>
            <p className="text-muted-foreground">Get insights into your productivity with detailed charts and metrics</p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border">
            <h3 className="font-semibold text-lg mb-2">Distraction Detection</h3>
            <p className="text-muted-foreground">Identify and manage distracting websites automatically</p>
          </div>
        </div>
      </div>
    </main>
  )
}
