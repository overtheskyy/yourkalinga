import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI;
  private cache = new Map<string, any>();

  constructor(private prisma: PrismaService) {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || '',
      baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    });
  }

  async recommendDoctors(symptoms: string) {
    const cacheKey = symptoms.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const specializations = await this.prisma.doctorProfile.findMany({
      select: { specialization: true },
      distinct: ['specialization'],
    });

    const specializationList = specializations.map((s) => s.specialization).join(', ');

    try {
      const completion = await this.client.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a medical triage assistant for YourKalinga, a Filipino telehealth platform.
Your job is to recommend the most relevant medical specializations based on patient symptoms.
Available specializations: ${specializationList}
Respond ONLY with a valid JSON array of objects, no other text.
Format: [{"specialization": "...", "reason": "...", "urgency": "low|medium|high"}]
Order by relevance. Return 1-3 specializations maximum.`,
          },
          {
            role: 'user',
            content: `Patient symptoms: ${symptoms}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content || '[]';
      let recommendations: any[];

      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        recommendations = [];
      }

      const doctors = await this.prisma.doctorProfile.findMany({
        where: {
          specialization: {
            in: recommendations.map((r) => r.specialization),
          },
        },
        include: {
          schedules: { where: { isActive: true }, take: 1 },
          user: { select: { email: true } },
        },
        orderBy: { rating: 'desc' },
      });

      const result = {
        recommendations,
        doctors,
        symptoms,
      };

      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000); // 5-min cache

      return result;
    } catch (error) {
      this.logger.error('Groq AI error:', error);
      // Fallback: return all doctors sorted by rating
      const doctors = await this.prisma.doctorProfile.findMany({
        include: {
          schedules: { where: { isActive: true }, take: 1 },
          user: { select: { email: true } },
        },
        orderBy: { rating: 'desc' },
        take: 6,
      });
      return { recommendations: [], doctors, symptoms, fallback: true };
    }
  }
}
