import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoria',
    example: 'Pinturas',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Color de la categoria',
    example: 'Rojo',
  })
  @IsString()
  @IsOptional()
  color?: string;
}
