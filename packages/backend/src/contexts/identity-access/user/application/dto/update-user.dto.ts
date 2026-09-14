import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan@test.com',
    required: false,
  })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
    required: false,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Rol del usuario',
    example: 'CLIENT',
    enum: ['CLIENT', 'ADMIN'],
    required: false,
  })
  @IsEnum(['CLIENT', 'ADMIN'])
  @IsOptional()
  role?: 'CLIENT' | 'ADMIN';

  @ApiProperty({
    description: 'Estado del usuario',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED'],
    required: false,
  })
  @IsEnum(['ACTIVE', 'BLOCKED'])
  @IsOptional()
  status?: 'ACTIVE' | 'BLOCKED';
}
