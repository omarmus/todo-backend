import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/contexts/identity-access/auth/infrastructure/jwt-auth.guard';
import { CreateUserDto } from 'src/contexts/identity-access/user/application/dto/create-user.dto';
import { UpdateUserDto } from 'src/contexts/identity-access/user/application/dto/update-user.dto';
import { UserService } from 'src/contexts/identity-access/user/application/user.service';
import { CurrentUser } from 'src/contexts/identity-access/auth/infrastructure/current-user.decorator';

import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiOkResponse({
    description: 'Lista de usuarios (sin passwords)',
  })
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un usuario por ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
  })
  @ApiOkResponse({
    description: 'Usuario encontrado (sin password)',
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  async findOne(@Param('id') id: string) {
    return this.userService.getOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiCreatedResponse({
    description: 'Usuario creado correctamente',
  })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateUserDto,
  ) {
    return this.userService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un usuario',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
  })
  @ApiOkResponse({
    description: 'Usuario actualizado correctamente (sin password)',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo el propio usuario o un administrador puede actualizarlo',
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser()
    currentUser: { id: string; role: string },
  ) {
    return this.userService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un usuario',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
  })
  @ApiNoContentResponse({
    description: 'Usuario eliminado correctamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo los administradores pueden eliminar usuarios',
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser()
    currentUser: { id: string; role: string },
  ) {
    await this.userService.deleteItem(id, currentUser);
  }
}
