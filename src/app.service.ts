import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AgeGroup,
  AgeResponse,
  CountryProbability,
  GenderResponse,
  ModifiedResponse,
  NationalityResponse,
} from './types';
import { PrismaService } from './prisma/prisma.service';
import { QueryDto } from './dto/Query.dto';

import { Prisma } from './generated/prisma/client';
import { CreateDto } from './dto/Create.dto';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}
  getHello(): string {
    return 'Hello World!';
  }

  getAgeGroup(age: number | null): AgeGroup {
    if (age === null) return 'unknown';
    if (age <= 12) return 'child';
    if (age <= 19) return 'teenager';
    if (age <= 59) return 'adult';
    return 'child';
  }

  getNationalilty(country: Array<CountryProbability>): CountryProbability {
    let bestCountry;
    if (country.length > 0) {
      bestCountry = country.reduce((prev, curr) =>
        curr.probability > prev.probability ? curr : prev,
      );
    }
    return bestCountry;
  }

  async getReponses(name: string) {
    const genderizeAPI = await fetch(`https://api.genderize.io/?name=${name}`);
    const AgifyAPI = await fetch(` https://api.agify.io?name=${name}`);
    const NationalizeAPI = await fetch(
      `https://api.nationalize.io?name=${name}`,
    );

    const genderizeAPIResponse: GenderResponse = await genderizeAPI.json();
    const AgifyAPIResponse: AgeResponse = await AgifyAPI.json();
    const NationalizeAPIResponse: NationalityResponse =
      await NationalizeAPI.json();

    const { gender, probability, count: sample_size } = genderizeAPIResponse;

    const age = AgifyAPIResponse.age;
    const age_group = this.getAgeGroup(age);
    const Nationality: CountryProbability | null = this.getNationalilty(
      NationalizeAPIResponse?.country,
    );
    const modifiedResponse: ModifiedResponse = {
      data: {
        name,
        gender,
        gender_probability: probability,
        sample_size,
        age,
        age_group,
        country_id: Nationality.country_id,
        country_probability: Number(Nationality?.probability.toFixed(2)),
      },
    };
    if (
      gender === null ||
      sample_size === 0 ||
      age === null ||
      NationalizeAPIResponse.country.length === 0
    ) {
      throw new BadGatewayException({
        status: 'error',
        message: 'External Api returned invalid response',
      });
    }

    return modifiedResponse;
  }

  async createProfile(createDto: CreateDto) {
    const name = createDto.name;

    const nameExist = await this.prisma.user.findUnique({
      where: { name },
    });
    if (nameExist) {
      return {
        staus: 'success',
        message: 'Profile already exists',
        data: nameExist,
      };
    }

    const resolvedResponse = await this.getReponses(name);

    const createuser = await this.prisma.user.create({
      data: resolvedResponse.data,
    });

    return {
      status: 'success',
      data: createuser,
    };
  }
  async GetProfileByID(id: string) {
    const userExist = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!userExist) {
      throw new NotFoundException('No such user exist');
    }
    return {
      status: 'success',
      data: userExist,
    };
  }
  async GetAllProfiles(query: QueryDto) {
    const { age_group, country_id, gender } = query;
    const queries: Prisma.UserWhereInput = {
      ...(gender && {
        gender: {
          equals: gender,
          mode: 'insensitive',
        },
      }),

      ...(country_id && {
        country_id: {
          equals: country_id,
          mode: 'insensitive',
        },
      }),

      ...(age_group && {
        age_group: {
          equals: age_group,
          mode: 'insensitive',
        },
      }),
    };
    const [data, count] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: queries,
      }),
      this.prisma.user.count({ where: queries }),
    ]);
    return {
      status: 'success',
      count,
      data,
    };
  }

  async deleteProfile(id: string) {
    const userExist = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!userExist) {
      throw new NotFoundException({
        status: 'error',
        message: 'Profile not fount',
      });
    }
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
