'use client';
import { useEffect, useState } from 'react';
import { patientsApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save, User, Phone, MapPin, Droplets, Weight, Ruler, AlertCircle, Pill, FileText } from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; contactNumber?: string }>({});

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    contactNumber: '',
    address: '',
    bloodType: '',
    weight: '',
    height: '',
    allergies: '',
    medications: '',
    medicalHistory: '',
  });

  useEffect(() => {
    patientsApi.getMyProfile().then((res) => {
      const p = res.data;
      setForm({
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        birthday: p.birthday ? p.birthday.split('T')[0] : '',
        contactNumber: p.contactNumber || '',
        address: p.address || '',
        bloodType: p.bloodType || '',
        weight: p.weight != null ? String(p.weight) : '',
        height: p.height != null ? String(p.height) : '',
        allergies: p.allergies || '',
        medications: p.medications || '',
        medicalHistory: p.medicalHistory || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setSaving(true);
    try {
      await patientsApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        birthday: form.birthday || undefined,
        contactNumber: form.contactNumber || undefined,
        address: form.address || undefined,
        bloodType: form.bloodType || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        allergies: form.allergies || undefined,
        medications: form.medications || undefined,
        medicalHistory: form.medicalHistory || undefined,
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
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your personal and medical information</p>
      </div>


      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-teal-600" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
              <input
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.firstName ? 'border-red-400' : 'border-gray-200'}`}
                value={form.firstName}
                onChange={(e) => { set('firstName', e.target.value); setErrors((e) => ({ ...e, firstName: undefined })); }}
                placeholder="First name"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
              <input
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.lastName ? 'border-red-400' : 'border-gray-200'}`}
                value={form.lastName}
                onChange={(e) => { set('lastName', e.target.value); setErrors((e) => ({ ...e, lastName: undefined })); }}
                placeholder="Last name"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Birthday</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={form.birthday}
              onChange={(e) => set('birthday', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-400" /> Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.contactNumber ? 'border-red-400' : 'border-gray-200'}`}
              value={form.contactNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                set('contactNumber', val);
                setErrors((e) => ({ ...e, contactNumber: undefined }));
              }}
              placeholder="09XXXXXXXXX"
              inputMode="numeric"
              maxLength={11}
            />
            {errors.contactNumber && <p className="mt-1 text-xs text-red-500">{errors.contactNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gray-400" /> Address
            </label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="City, Province"
            />
          </div>
        </CardContent>
      </Card>

      {/* Physical Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4 text-teal-600" /> Physical Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Type</label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_TYPES.map((bt) => (
                <button
                  key={bt}
                  onClick={() => set('bloodType', form.bloodType === bt ? '' : bt)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                    form.bloodType === bt
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Weight className="h-3.5 w-3.5 text-gray-400" /> Weight (kg)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                step="0.1"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={form.weight}
                onChange={(e) => set('weight', e.target.value)}
                placeholder="e.g. 65"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 text-gray-400" /> Height (cm)
              </label>
              <input
                type="number"
                min="50"
                max="250"
                step="0.1"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={form.height}
                onChange={(e) => set('height', e.target.value)}
                placeholder="e.g. 165"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" /> Medical History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-red-400" /> Allergies
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={2}
              value={form.allergies}
              onChange={(e) => set('allergies', e.target.value)}
              placeholder="e.g. Penicillin, shellfish, pollen..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5 text-blue-400" /> Current Medications
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={2}
              value={form.medications}
              onChange={(e) => set('medications', e.target.value)}
              placeholder="List any medications you are currently taking..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-gray-400" /> Medical History
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={3}
              value={form.medicalHistory}
              onChange={(e) => set('medicalHistory', e.target.value)}
              placeholder="Previous conditions, surgeries, chronic illnesses..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex items-center justify-end gap-3 pb-6">
        {saved && (
          <span className="text-sm text-teal-600 font-medium">Profile saved!</span>
        )}
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Profile</>}
        </Button>
      </div>
    </div>
  );
}
