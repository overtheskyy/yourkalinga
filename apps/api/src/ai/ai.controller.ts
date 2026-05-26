import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { IsString } from 'class-validator';
import { Public } from '../auth/public.decorator';

class SymptomDto {
  @IsString() symptoms: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Post('recommend')
  recommend(@Body() dto: SymptomDto) {
    return this.aiService.recommendDoctors(dto.symptoms);
  }
}
