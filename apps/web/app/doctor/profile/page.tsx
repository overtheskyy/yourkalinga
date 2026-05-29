'use client';
import { useEffect, useState } from 'react';
import { doctorsApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save, User, Stethoscope, FileText, Languages, BadgeDollarSign, ChevronDown } from 'lucide-react';

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

const LANGUAGES = [
  'English', 'Filipino', 'Tagalog', 'Cebuano', 'Ilocano',
  'Hiligaynon', 'Waray', 'Kapampangan', 'Pangasinan', 'Bikol',
];

export default function DoctorProfilePage() {
  const { updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; specialization?: string }>({});

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    specialization: '',

    yearsExperience: '',
    consultationFee: '',
    bio: '',
    languages: [] as string[],
  });

  useEffect(() => {
    doctorsApi.getMyProfile().then((res) => {
      const p = res.data;
      setForm({
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        specialization: p.specialization || '',

        yearsExperience: p.yearsExperience != null ? String(p.yearsExperience) : '',
        consultationFee: p.consultationFee != null ? String(p.consultationFee) : '',
        bio: p.bio || '',
        languages: p.languages || [],
      });
    }).finally(() => setLoading(false));
  }, []);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const toggleLanguage = (lang: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.specialization) newErrors.specialization = 'Specialization is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setSaving(true);
    try {
      await doctorsApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        specialization: form.specialization,

        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
        bio: form.bio || undefined,
        languages: form.languages.length > 0 ? form.languages : undefined,
      });
      const meRes = await authApi.me();
      updateUser(meRes.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 max-w-2xl">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your professional information visible to patients</p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-teal-600" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.firstName ? 'border-red-400' : 'border-gray-200'}`}
                value={form.firstName}
                onChange={(e) => { set('firstName', e.target.value); setErrors((err) => ({ ...err, firstName: undefined })); }}
                placeholder="First name"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.lastName ? 'border-red-400' : 'border-gray-200'}`}
                value={form.lastName}
                onChange={(e) => { set('lastName', e.target.value); setErrors((err) => ({ ...err, lastName: undefined })); }}
                placeholder="Last name"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-teal-600" /> Professional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Specialization <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className={`w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.specialization ? 'border-red-400' : 'border-gray-200'}`}
                value={form.specialization}
                onChange={(e) => { set('specialization', e.target.value); setErrors((err) => ({ ...err, specialization: undefined })); }}
              >
                <option value="" disabled>Select specialization</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.specialization && <p className="mt-1 text-xs text-red-500">{errors.specialization}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="60"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={form.yearsExperience}
                onChange={(e) => set('yearsExperience', e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <BadgeDollarSign className="h-3.5 w-3.5 text-gray-400" /> Consultation Fee (₱)
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={form.consultationFee}
                onChange={(e) => set('consultationFee', e.target.value)}
                placeholder="e.g. 500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4 text-teal-600" /> Languages Spoken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                  form.languages.includes(lang)
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" /> Professional Bio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            rows={4}
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="Tell patients about your background, approach to care, and what makes you a great doctor..."
          />
          <p className="mt-1 text-xs text-gray-400">{form.bio.length}/500 characters</p>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pb-6">
        {saved && <span className="text-sm text-teal-600 font-medium">Profile saved!</span>}
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Profile</>}
        </Button>
      </div>
    </div>
  );
}
