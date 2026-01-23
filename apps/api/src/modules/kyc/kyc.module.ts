import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  providers: [],
  exports: [],
})
export class KycModule {}
