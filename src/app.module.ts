import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './datasource/database.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { StoresModule } from './stores/stores.module';
import { UserstoresModule } from './relations/userstores/userstores.module';

@Module({
  imports: [DatabaseModule, UsersModule, StoresModule, UserstoresModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
