import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository, UserUpdateData } from '../domain/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { toSafeUser, toSafeUsers } from '../domain/user.entity';
import { NotificationPort } from 'src/contexts/tasks/todo/domain/notification.port';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async create(dto: CreateUserDto, userId: string) {
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

    await this.notificationPort.send({
      userId,
      type: 'TASK_CREATED',
      title: 'Nuevo usuario',
      message: `Se creó el usuario "${dto.name}"`,
      metadata: { user: toSafeUser(user) },
    });

    return toSafeUser(user);
  }

  async getOne(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return toSafeUser(user);
  }

  async update(id: string, dto: UpdateUserDto, currentUser: UserContext) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own user');
    }

    const updateData: UserUpdateData = {};

    if (dto.email !== undefined && dto.email !== existing.email) {
      const duplicated = await this.userRepository.findByEmail(dto.email);
      if (duplicated && duplicated.id !== id) {
        throw new Error('User with this email already exists');
      }
      updateData.email = dto.email;
    }

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.password !== undefined) {
      updateData.password = await argon2.hash(dto.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
    }

    const updated = await this.userRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return toSafeUser(updated);
  }

  async delete(id: string, currentUser: UserContext) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can delete users');
    }

    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    try {
      await this.userRepository.delete(id);
    } catch {
      throw new ConflictException(
        'User cannot be deleted because it has related records',
      );
    }

    return { message: 'User deleted successfully' };
  }
}

type UserContext = {
  id: string;
  role: 'CLIENT' | 'ADMIN';
};
