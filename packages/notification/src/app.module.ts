import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContextsModule } from './contexts/contexts.module';
import { AppsModule } from './apps/apps.module';
import { MongooseSharedModule } from './shared/infrastructure/mongoose/mongoose.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseSharedModule,
    ContextsModule,
    AppsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
