import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './datasource/database.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [DatabaseModule, UsersModule, StoresModule],
})
export class AppModule {}
