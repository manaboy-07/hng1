import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';
import { QueryDto } from './dto/Query.dto';

import { CreateDto } from './dto/Create.dto';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Post('profiles')
  // async createProfile(@Body() createDto: CreateDto) {
  //   return await this.appService.createProfile(createDto);
  // }

  @Get('profiles/search')
  async searchProfiles(@Query() q: string) {
    return await this.appService.SearchProfiles(q);
  }

  @Get('profiles')
  async getAllProfiles(@Query() query: QueryDto) {
    return await this.appService.GetAllProfiles(query);
  }

  @Get('profiles/:id')
  async getProfileByID(@Param('id') id: string) {
    return await this.appService.GetProfileByID(id);
  }

  @Delete('profiles/:id')
  async deteleProfile(@Param('id') id: string) {
    return await this.appService.deleteProfile(id);
  }
}
