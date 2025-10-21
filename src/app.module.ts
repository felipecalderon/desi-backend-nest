import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './datasource/database.module';

@Module({
  imports: [DatabaseModule, UsersModule],
})
export class AppModule {}
