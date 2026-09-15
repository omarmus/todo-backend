import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Email del usuario',
    example: 'nuevo@email.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario',
    enum: ['CLIENT', 'ADMIN'],
    example: 'ADMIN',
  })
  @IsEnum(['CLIENT', 'ADMIN'])
  @IsOptional()
  role?: 'CLIENT' | 'ADMIN';

  @ApiPropertyOptional({
    description: 'Estado del usuario',
    enum: ['ACTIVE', 'BLOCKED'],
    example: 'ACTIVE',
  })
  @IsEnum(['ACTIVE', 'BLOCKED'])
  @IsOptional()
  status?: 'ACTIVE' | 'BLOCKED';
}