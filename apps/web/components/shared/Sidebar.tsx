'use client';
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
];

interface SidebarProps {
  role: 'PATIENT' | 'DOCTOR';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = role === 'DOCTOR' ? doctorLinks : patientLinks;

  return (
    <aside className="w-56 shrink-0 border-r border-gray-100 bg-white min-h-[calc(100vh-4rem)]">
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
    </aside>
  );
}
