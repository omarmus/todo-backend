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

import { CreateCategoryDto } from '../../contexts/tasks/category/application/dto/create-category.dto';
import { UpdateCategoryDto } from '../../contexts/tasks/category/application/dto/update-category.dto';
import { CategoryService } from 'src/contexts/tasks/category/application/category.service';
import { JwtAuthGuard } from 'src/contexts/identity-access/auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from 'src/contexts/identity-access/auth/infrastructure/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Category')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las categorias del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoria por ID' })
  @ApiParam({ name: 'id', description: 'ID de la categoria' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada' })
  @ApiResponse({ status: 404, description: 'Categoria no encontrada' })
  findOne(@Param('id') id: string) {
    return this.categoryService.getOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva categoria para el usuario autenticado' })
  @ApiResponse({ status: 201, description: 'Categoria creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(
    @CurrentUser() user: { id: string },
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.create(user.id, createCategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parcialmente una categoria' })
  @ApiParam({ name: 'id', description: 'ID de la categoria' })
  @ApiResponse({ status: 200, description: 'Categoria actualizada' })
  @ApiResponse({ status: 404, description: 'Categoria no encontrada' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una categoria' })
  @ApiParam({ name: 'id', description: 'ID de la categoria' })
  @ApiResponse({ status: 200, description: 'Categoria eliminada' })
  @ApiResponse({ status: 404, description: 'Categoria no encontrada' })
  delete(@Param('id') id: string) {
    return this.categoryService.deleteItem(id);
  }
}
