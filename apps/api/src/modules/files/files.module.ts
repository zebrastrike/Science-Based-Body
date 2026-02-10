import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { R2StorageService } from './r2-storage.service';
import { LocalStorageService } from './local-storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [FilesController],
  providers: [FilesService, R2StorageService, LocalStorageService],
  exports: [FilesService, R2StorageService, LocalStorageService],
})
export class FilesModule {}
