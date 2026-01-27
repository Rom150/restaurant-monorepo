// src/auth/auth.controller.ts
import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Req() req: Request, @Body() dto: LoginDto) {
    const ip: string = req.ip ?? '';
    const userAgent: string = (req.headers['user-agent'] ?? '')?.toString();
    return this.authService.login(dto, { ip, userAgent });
  }
}
