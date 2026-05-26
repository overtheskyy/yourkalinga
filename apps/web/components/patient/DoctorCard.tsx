'use client';
import Link from 'next/link';
import { Star, Clock, Languages, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import type { DoctorProfile } from '@/types';

interface DoctorCardProps {
  doctor: DoctorProfile;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const hasSchedule = doctor.schedules && doctor.schedules.length > 0;

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-14 w-14 shrink-0">
            {doctor.avatarUrl && <AvatarImage src={doctor.avatarUrl} alt={`Dr. ${doctor.lastName}`} />}
            <AvatarFallback className="text-base">
              {getInitials(doctor.firstName, doctor.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-gray-900 truncate">
                Dr. {doctor.firstName} {doctor.lastName}
              </p>
              {doctor.isVerified && (
                <CheckCircle className="h-3.5 w-3.5 text-teal-500 shrink-0" />
              )}
            </div>
            <Badge className="mt-0.5 text-[10px]">{doctor.specialization}</Badge>
          </div>
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {doctor.bio || 'Specialist dedicated to providing quality patient care.'}
        </p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span className="font-medium text-gray-700">{doctor.rating.toFixed(1)}</span>
            <span>({doctor.reviewCount} reviews)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            {doctor.yearsExperience} years experience
          </div>
          {doctor.languages && doctor.languages.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Languages className="h-3.5 w-3.5 text-gray-400" />
              {doctor.languages.join(', ')}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">Consultation</span>
            <p className="text-sm font-semibold text-teal-700">
              ₱{doctor.consultationFee.toLocaleString()}
            </p>
          </div>
          <Link href={`/patient/doctors/${doctor.id}`}>
            <Button size="sm" disabled={!hasSchedule}>
              {hasSchedule ? 'Book now' : 'Unavailable'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
