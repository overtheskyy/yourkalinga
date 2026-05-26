'use client';
import Link from 'next/link';
import { ArrowRight, Heart, Shield, Video, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">YK</span>
          </div>
          <span className="text-xl font-bold text-teal-700">YourKalinga</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-sm text-teal-700 font-medium mb-6">
          <Heart className="h-3.5 w-3.5" />
          Filipino-rooted care for everyone
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Your health,{' '}
          <span className="text-teal-600">your kalinga</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Connect with trusted Filipino doctors from the comfort of your home. Book consultations,
          get AI-powered recommendations, and manage your health journey — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register?role=PATIENT">
            <Button size="lg" className="gap-2">
              Book a consultation <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register?role=DOCTOR">
            <Button size="lg" variant="outline">
              Join as a doctor
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Brain,
              title: 'AI Recommendations',
              desc: 'Describe your symptoms and get matched with the right specialist instantly.',
            },
            {
              icon: Video,
              title: 'Video Consultations',
              desc: 'Join secure video calls with your doctor — no downloads required.',
            },
            {
              icon: Shield,
              title: 'Trusted Doctors',
              desc: 'All doctors are verified. View profiles, specializations, and real patient reviews.',
            },
            {
              icon: Heart,
              title: 'Complete Health Records',
              desc: 'Access your consultation history, prescriptions, and medical notes anytime.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
                <Icon className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        <p>
          © 2026 YourKalinga · Built with care for the Filipino community ·{' '}
          <span className="text-teal-600 italic">Kalinga</span> means care
        </p>
      </footer>
    </div>
  );
}
