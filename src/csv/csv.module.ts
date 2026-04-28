import { Module } from '@nestjs/common';
import { CsvService } from './csv.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [CsvService],
  exports: [CsvService],
})
export class CsvModule {}
