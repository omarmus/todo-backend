import { Module } from '@nestjs/common';
import { UserService } from './application/user.service';
import { UserRepository } from './domain/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';

@Module({
  providers: [
    UserService,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
