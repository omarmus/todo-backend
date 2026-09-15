import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { toSafeUser, toSafeUsers } from '../domain/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll() {
    const users = await this.userRepository.findAll();
    return toSafeUsers(users);
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return toSafeUser(user);
  }

  async create(dto: CreateUserDto) {
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

    return toSafeUser(user);
  }

  async update(id: string, dto: Partial<CreateUserDto>) {
    await this.findById(id);
    const data: any = { ...dto };
    if (dto.password) {
      data.password = await argon2.hash(dto.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
    }
    const user = await this.userRepository.update(id, data);
    return toSafeUser(user);
  }

  async deleteItem(id: string) {
    await this.findById(id);
    return this.userRepository.deleteItem(id);
  }
}
