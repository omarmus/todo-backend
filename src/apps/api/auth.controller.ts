import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from 'src/contexts/identity-access/auth/application/auth.service';
import { LoginDto } from 'src/contexts/identity-access/auth/application/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
