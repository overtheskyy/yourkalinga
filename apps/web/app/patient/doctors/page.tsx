'use client';
import { useEffect, useState } from 'react';
import { doctorsApi, aiApi } from '@/lib/api';
import { DoctorCard } from '@/components/patient/DoctorCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, Brain, X, Loader2, Sparkles } from 'lucide-react';
import type { DoctorProfile } from '@/types';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [loading, setLoading] = useState(true);
  const [symptoms, setSymptoms] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    doctorsApi.getSpecializations().then((res) => setSpecializations(res.data));
    fetchDoctors();
  }, []);

  const fetchDoctors = async (s?: string, spec?: string) => {
    setLoading(true);
    try {
      const res = await doctorsApi.getAll({ search: s, specialization: spec });
      setDoctors(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchDoctors(search, selectedSpec);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value === '') fetchDoctors('', selectedSpec);
  };

  const handleSpec = (spec: string) => {
    const next = selectedSpec === spec ? '' : spec;
    setSelectedSpec(next);
    fetchDoctors(search, next);
  };

  const handleAiRecommend = async () => {
    if (!symptoms.trim()) return;
    setAiLoading(true);
    setShowAi(true);
    try {
      const res = await aiApi.recommend(symptoms);
      setAiRecommendations(res.data.recommendations);
      setDoctors(res.data.doctors);
    } finally {
      setAiLoading(false);
    }
  };

  const clearAi = () => {
    setShowAi(false);
    setAiRecommendations([]);
    setSymptoms('');
    fetchDoctors();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Your Doctor</h1>
        <p className="text-gray-500 text-sm mt-1">Browse trusted specialists or describe your symptoms for AI recommendations</p>
      </div>

      {/* AI Symptom Checker */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 p-5">
        <div className="flex items-center gap-2 text-white mb-3">
          <Brain className="h-5 w-5" />
          <span className="font-semibold">AI Doctor Recommendation</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Describe your symptoms (e.g., chest pain and shortness of breath)"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiRecommend()}
            className="bg-white/90 border-0 placeholder:text-gray-400"
          />
          <Button
            onClick={handleAiRecommend}
            disabled={aiLoading || !symptoms.trim()}
            className="bg-white text-teal-700 hover:bg-white/90 shrink-0"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {showAi && aiRecommendations.length > 0 && (
        <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-teal-700 flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> AI Recommendations
            </p>
            <button onClick={clearAi} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiRecommendations.map((r, i) => (
              <div key={i} className="rounded-lg bg-white border border-teal-100 px-3 py-2">
                <p className="text-sm font-medium text-gray-800">{r.specialization}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.reason}</p>
                <Badge
                  className={`mt-1 text-[10px] ${r.urgency === 'high' ? 'bg-red-100 text-red-700' : r.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                >
                  {r.urgency} urgency
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or specialization..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">Search</Button>
      </div>

      {/* Specialization filters */}
      <div className="flex flex-wrap gap-2">
        {specializations.map((spec) => (
          <button
            key={spec}
            onClick={() => handleSpec(spec)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedSpec === spec
              ? 'bg-teal-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
              }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Doctor grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No doctors found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}
