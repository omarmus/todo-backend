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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CategoryService } from 'src/contexts/tasks/category/application/category.service';
import { CreateCategoryDto } from 'src/contexts/tasks/category/application/dto/create-category.dto';
import { UpdateCategoryDto } from 'src/contexts/tasks/category/application/dto/update-category.dto';
import { JwtAuthGuard } from 'src/contexts/identity-access/auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from 'src/contexts/identity-access/auth/infrastructure/current-user.decorator';

@ApiTags('Categories')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de categorías' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.categoryService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  getOne(@Param('id') id: string) {
    return this.categoryService.getOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva categoría para el usuario autenticado' })
  @ApiCreatedResponse({ description: 'Categoría creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente una categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría eliminada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  deleteItem(@Param('id') id: string) {
    return this.categoryService.deleteItem(id);
  }
}