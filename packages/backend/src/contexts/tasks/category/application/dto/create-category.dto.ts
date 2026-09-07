import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Trabajo',
    description: 'Nombre de la categoría',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: '#FF5733',
    description: 'Color de la categoría en formato hexadecimal',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;
}