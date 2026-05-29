'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Stethoscope,
  Calendar,
  FileText,
  Clock,
  Users,
  UserCircle,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const patientLinks = [
  { href: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/patient/doctors', icon: Stethoscope, label: 'Find Doctors' },
  { href: '/patient/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/patient/records', icon: FileText, label: 'Medical Records' },
  { href: '/patient/profile', icon: UserCircle, label: 'My Profile' },
];

const doctorLinks = [
  { href: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/doctor/schedule', icon: Clock, label: 'My Schedule' },
  { href: '/doctor/patients', icon: Users, label: 'My Patients' },
  { href: '/doctor/profile', icon: UserCircle, label: 'My Profile' },
];

interface SidebarProps {
  role: 'PATIENT' | 'DOCTOR';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = role === 'DOCTOR' ? doctorLinks : patientLinks;

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 p-4">
      {links.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-teal-50 text-teal-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <Icon className={cn('h-4 w-4', active ? 'text-teal-600' : 'text-gray-400')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-xl transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600">
              <span className="text-xs font-bold text-white">YK</span>
            </div>
            <span className="font-bold text-teal-700">YourKalinga</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <NavLinks />
      </aside>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:block w-56 shrink-0 border-r border-gray-100 bg-white min-h-[calc(100vh-4rem)]">
        <NavLinks />
      </aside>
    </>
  );
}
