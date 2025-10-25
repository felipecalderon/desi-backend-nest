import { Module } from '@nestjs/common';
import { StoresModule as StoresM } from './stores/stores.module';
import { UserstoresModule } from './userstores/userstores.module';

@Module({
  imports: [StoresM, UserstoresModule],
  exports: [StoresM, UserstoresModule],
})
export class StoresModule {}
