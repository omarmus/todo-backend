import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { toSafeUser, toSafeUsers } from '../domain/user.entity';
import { NotificationPort } from 'src/contexts/tasks/todo/domain/notification.port';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationPort: NotificationPort,
  ) {}

  async findAll() {
    const users = await this.userRepository.findAll();
    return toSafeUsers(users);
  }

  async findOne(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return toSafeUser(user);
  }

  async create(dto: CreateUserDto, userId?: string) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const user = await this.userRepository.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: 'CLIENT',
      status: 'ACTIVE',
    });

    // Solo enviamos la notificación si hay un userId disponible
    if (userId) {
      await this.notificationPort.send({
        userId,
        type: 'TASK_CREATED',
        title: 'Nuevo usuario',
        message: `Se creó el usuario "${dto.name}"`,
        metadata: { user: toSafeUser(user) },
      });
    }

    return toSafeUser(user);
  }

  async update(id: string, dto: any) {
    await this.findOne(id); // Verifica que el usuario exista antes de actualizar

    let updateData = { ...dto };
    if (updateData.password) {
      updateData.password = await argon2.hash(updateData.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
    }

    const updatedUser = await this.userRepository.update(id, updateData);
    return toSafeUser(updatedUser);
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica que el usuario exista antes de eliminar
    return this.userRepository.delete(id);
  }
}