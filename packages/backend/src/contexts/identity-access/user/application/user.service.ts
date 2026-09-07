import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

  async getOne(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(
        `User with id ${id} not found`,
      );
    }

    return toSafeUser(user);
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

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: { id: string; role: string },
  ) {
    if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException(
        'You can only update your own user',
      );
    }

    const existing = await this.userRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        `User with id ${id} not found`,
      );
    }

    if (
      dto.email !== undefined &&
      dto.email !== existing.email
    ) {
      const emailExists = await this.userRepository.findByEmail(
        dto.email,
      );

      if (emailExists && emailExists.id !== id) {
        throw new Error('User with this email already exists');
      }
    }

    const data: {
      email?: string;
      name?: string | null;
      password?: string;
    } = {
      ...(dto.email !== undefined && {
        email: dto.email,
      }),
      ...(dto.name !== undefined && {
        name: dto.name,
      }),
    };

    if (dto.password !== undefined) {
      data.password = await argon2.hash(dto.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
    }

    const user = await this.userRepository.update(id, data);

    if (!user) {
      throw new NotFoundException(
        `User with id ${id} not found`,
      );
    }

    return toSafeUser(user);
  }

  async deleteItem(
    id: string,
    currentUser: { id: string; role: string },
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only administrators can delete users',
      );
    }

    const existing = await this.userRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        `User with id ${id} not found`,
      );
    }

    await this.userRepository.deleteItem(id);
  }
}
