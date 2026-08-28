import { Optional } from '@nestjs/common';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateTodoDto {
  @IsString()
  @IsNotEmpty()
  @Optional()
  title: string;

  @IsBoolean()
  @Optional()
  completed: boolean;
}
