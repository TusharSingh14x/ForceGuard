'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Zap, Target, TrendingUp, ArrowRight, Play, CheckCircle2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push('/protected')
      } else {
        setIsAuthChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full animate-pulse [animation-delay:1s]" />
      </div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="bg-primary p-2 rounded-xl transition-transform group-hover:rotate-12">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">FocusGuard</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/auth/login" className="text-sm font-semibold hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className="px-5 py-2.5 bg-foreground text-background rounded-full text-sm font-bold hover:opacity-90 transition-all active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          Intelligent Productivity Assistant
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tightest leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          CONQUER YOUR <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient-x">
            DIGITAL FOCUS
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-900">
          Elite performance tracking meets intelligent distraction blocking.
          FocusGuard doesn't just watch your time—it guards your flow state.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <Link
            href="/auth/sign-up"
            className="group px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95"
          >
            Start Your First Session
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 bg-secondary text-foreground rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all">
            <Play className="w-5 h-5 fill-current" />
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Neural Analytics",
              desc: "Deep-dive into your focus patterns with high-precision metrics and behavioral visualization.",
              icon: Zap,
              color: "text-primary bg-primary/10"
            },
            {
              title: "Deep Flow Shield",
              desc: "Proactive distraction blocking that activates when it detects your focus is slipping away.",
              icon: Shield,
              color: "text-secondary bg-secondary/10"
            },
            {
              title: "Behavioral Chains",
              desc: "Map how one distraction leads to another with our proprietary node-based activity graphs.",
              icon: Target,
              color: "text-accent bg-accent/10"
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-8 bg-card border border-border/50 rounded-[2.5rem] hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-secondary/20 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-16 tracking-tight">DESIGNED FOR ULTRA-PRODUCTIVITY</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {['Flow State Detection', 'Screen Blocking', 'Daily Insights', 'Privacy First'].map((item) => (
              <div key={item} className="flex flex-col items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
                <span className="font-bold text-sm tracking-widest uppercase">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-black tracking-tighter uppercase text-sm">FocusGuard © 2026</span>
        </div>
        <div className="flex gap-8 text-sm text-muted-foreground font-medium">
          <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Security</Link>
        </div>
      </footer>
    </main>
  )
}
