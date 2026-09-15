import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/contexts/identity-access/auth/infrastructure/jwt-auth.guard';
import { CreateUserDto } from 'src/contexts/identity-access/user/application/dto/create-user.dto';
import { UpdateUserDto } from 'src/contexts/identity-access/user/application/dto/update-user.dto';
import { UserService } from 'src/contexts/identity-access/user/application/user.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/contexts/identity-access/auth/infrastructure/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiOkResponse({ description: 'Lista de usuarios (sin passwords)' })
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiOkResponse({ description: 'Usuario encontrado (sin password)' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiCreatedResponse({ description: 'Usuario creado correctamente' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateUserDto) {
    return this.userService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiOkResponse({ description: 'Usuario actualizado correctamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: { id: string; role: string },
  ) {
    return this.userService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un usuario (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiOkResponse({ description: 'Usuario eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string; role: string },
  ) {
    await this.userService.delete(id, currentUser);
    return { message: 'User deleted successfully' };
  }
}