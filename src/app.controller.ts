import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { QueryDto } from './dto/Query.dto';

import { CreateDto } from './dto/Create.dto';
import { JWTAuthGuard } from './auth/guards/jwt.guard';
import { Roles } from './auth/decorators/role.decorator';
import { Role } from './auth/enums/role.enum';
import { ApiVersionGuard } from './auth/guards/api-version.guard';
import { CsvService } from './csv/csv.service';
import type { Response } from 'express';

@UseGuards(ApiVersionGuard, JWTAuthGuard)
@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly csvService: CsvService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Roles(Role.ADMIN)
  @Post('profiles')
  async createProfile(@Body() createDto: CreateDto) {
    return await this.appService.createProfile(createDto);
  }

  @Get('profiles/search')
  async searchProfiles(@Query() q: string) {
    return await this.appService.SearchProfiles(q);
  }

  // @Roles(Role.ADMIN)
  @Get('profiles/export')
  async exportCsv(@Query() query: QueryDto, @Res() res: Response) {
    if (query.format !== 'csv') {
      throw new BadRequestException('Only CSV format supported');
    }
    const csv = await this.csvService.exportProfiles(query);
    const timestamp = new Date().toISOString();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="profiles_${timestamp}.csv"`,
    );

    res.status(200).send(csv);
  }

  @Get('profiles')
  async getAllProfiles(@Query() query: QueryDto) {
    return await this.appService.GetAllProfiles(query);
  }

  @Get('profiles/:id')
  async getProfileByID(@Param('id') id: string) {
    return await this.appService.GetProfileByID(id);
  }

  @Roles(Role.ADMIN)
  @Delete('profiles/:id')
  async deteleProfile(@Param('id') id: string) {
    return await this.appService.deleteProfile(id);
  }
}
