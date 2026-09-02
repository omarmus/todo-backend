import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUserDto } from 'src/contexts/identity-access/user/application/dto/create-user.dto';
import { UserService } from 'src/contexts/identity-access/user/application/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
