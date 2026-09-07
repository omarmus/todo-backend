import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    example: 'Trabajo',
    description: 'Nuevo nombre de la categoría',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    example: '#FF5733',
    description: 'Nuevo color de la categoría en formato hexadecimal',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;
}