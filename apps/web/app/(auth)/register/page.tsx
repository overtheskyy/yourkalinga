'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2, UserRound, Stethoscope, ChevronDown } from 'lucide-react';

const SPECIALIZATIONS = [
  'General Practice',
  'Internal Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Neurology',
  'Psychiatry',
  'Ophthalmology',
  'ENT (Ear, Nose & Throat)',
  'Gastroenterology',
  'Pulmonology',
  'Endocrinology',
  'Nephrology',
  'Oncology',
  'Urology',
  'Rheumatology',
  'Emergency Medicine',
  'Family Medicine',
];
import { cn } from '@/lib/utils';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>(
    (searchParams.get('role') as 'PATIENT' | 'DOCTOR') || 'PATIENT',
  );
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    specialization: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role });
      router.push(role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
        <CardDescription>Join YourKalinga — your care starts here</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Role selector */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          {([['PATIENT', UserRound, 'I am a Patient'], ['DOCTOR', Stethoscope, 'I am a Doctor']] as const).map(
            ([r, Icon, label]) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-sm font-medium',
                  role === r
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300',
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ),
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="Juan"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="dela Cruz"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          {role === 'DOCTOR' && (
            <div className="space-y-1.5">
              <Label htmlFor="specialization">Specialization</Label>
              <div className="relative">
                <select
                  id="specialization"
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  required
                >
                  <option value="" disabled>Select your specialization</option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
            ) : (
              `Create ${role === 'DOCTOR' ? 'Doctor' : 'Patient'} Account`
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-teal-600 hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
