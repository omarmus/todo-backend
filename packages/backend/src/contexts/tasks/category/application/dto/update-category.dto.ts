import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoria',
    example: 'Pinturas',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Color de la categoria',
    example: 'Rojo',
  })
  @IsString()
  @IsOptional()
  color?: string;
}
