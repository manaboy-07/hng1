import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ParseIntPipe,
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
import { parseQuery } from './search.resolver';

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

  async resolveCountry(possibleCountry: string) {
    if (!possibleCountry) return null;

    return await this.prisma.user.findFirst({
      where: {
        country_name: {
          contains: possibleCountry,
          mode: 'insensitive',
        },
      },
      select: {
        country_id: true,
      },
    });
  }

  // async getReponses(name: string) {
  //   const genderizeAPI = await fetch(`https://api.genderize.io/?name=${name}`);
  //   const AgifyAPI = await fetch(` https://api.agify.io?name=${name}`);
  //   const NationalizeAPI = await fetch(
  //     `https://api.nationalize.io?name=${name}`,
  //   );

  //   const genderizeAPIResponse: GenderResponse = await genderizeAPI.json();
  //   const AgifyAPIResponse: AgeResponse = await AgifyAPI.json();
  //   const NationalizeAPIResponse: NationalityResponse =
  //     await NationalizeAPI.json();

  //   const { gender, probability, count: sample_size } = genderizeAPIResponse;

  //   const age = AgifyAPIResponse.age;
  //   const age_group = this.getAgeGroup(age);
  //   const Nationality: CountryProbability | null = this.getNationalilty(
  //     NationalizeAPIResponse?.country,
  //   );
  //   const modifiedResponse: ModifiedResponse = {
  //     data: {
  //       name,
  //       gender,
  //       gender_probability: probability,
  //       sample_size,
  //       age,
  //       age_group,
  //       country_id: Nationality.country_id,
  //       country_probability: Number(Nationality?.probability.toFixed(2)),
  //     },
  //   };
  //   if (
  //     gender === null ||
  //     sample_size === 0 ||
  //     age === null ||
  //     NationalizeAPIResponse.country.length === 0
  //   ) {
  //     throw new BadGatewayException({
  //       status: 'error',
  //       message: 'External Api returned invalid response',
  //     });
  //   }

  //   return modifiedResponse;
  // }

  // async createProfile(createDto: CreateDto) {
  //   const name = createDto.name;

  //   const nameExist = await this.prisma.user.findUnique({
  //     where: { name },
  //   });
  //   if (nameExist) {
  //     return {
  //       staus: 'success',
  //       message: 'Profile already exists',
  //       data: nameExist,
  //     };
  //   }

  //   const resolvedResponse = await this.getReponses(name);

  //   const createuser = await this.prisma.user.create({
  //     data: resolvedResponse.data,
  //   });

  //   return {
  //     status: 'success',
  //     data: createuser,
  //   };
  // }

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
    const specifiedOrder = ['asc', 'desc'];
    const sortMap = {
      age: 'age',
      created_at: 'createdAt',
      gender_probability: 'gender_probability',
    };

    const {
      age_group,
      country_id,
      gender,
      max_age,
      max_gender_probability,
      min_age,
      min_gender_probability,
      min_country_probability,
      limit,
      page,
      order,
      sort_by,
    } = query;
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

      ...(min_age || max_age
        ? {
            age: {
              ...(min_age !== undefined && { gte: Number(min_age) }),
              ...(max_age !== undefined && { lte: Number(max_age) }),
            },
          }
        : {}),

      ...(min_gender_probability || max_gender_probability
        ? {
            gender_probability: {
              ...(min_gender_probability && {
                gte: Number(min_gender_probability),
              }),
              ...(max_gender_probability && {
                lte: Number(max_gender_probability),
              }),
            },
          }
        : {}),

      ...(min_country_probability && {
        country_probability: {
          gte: Number(min_country_probability),
        },
      }),
    };

    if (sort_by && !Object.keys(sortMap).includes(sort_by)) {
      return { status: 'error', message: 'Invalid query parameters' };
    }
    if (order && !specifiedOrder.includes(order)) {
      return { status: 'error', message: 'Invalid query parameters' };
    }
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    if ((page && isNaN(Number(page))) || (limit && isNaN(Number(limit)))) {
      return { status: 'error', message: 'Invalid query parameters' };
    }
    const data = await this.prisma.user.findMany({
      where: queries,
      skip,
      take: limitNumber,
      orderBy: sort_by
        ? {
            [sortMap[sort_by]]: order || 'desc',
          }
        : {
            createdAt: 'desc',
          },
    });

    const count = await this.prisma.user.count({ where: queries });
    return {
      status: 'success',
      page: pageNumber,
      limit: limitNumber,
      total: count,
      data,
    };
  }
  async SearchProfiles(searchQuery: any) {
    const { q } = searchQuery;

    if (!q) {
      return { status: 'error', message: 'Unable to interpret query' };
    }

    const parsed = parseQuery(q.toLowerCase());
    if (!parsed) {
      return {
        status: 'error',
        message: 'Unable to interprete query',
      };
    }

    const where: any = {};

    if (parsed.gender) {
      where.gender = parsed.gender;
    }
    if (parsed.age_group) {
      where.age_group = parsed.age_group;
    }
    if (parsed.min_age || parsed.max_age) {
      where.age = {};
      if (parsed.min_age !== undefined) where.age.gte = parsed.min_age;
      if (parsed.max_age !== undefined) where.age.lte = parsed.max_age;
    }

    if (parsed.possibleCountry) {
      const country = await this.resolveCountry(parsed.possibleCountry);

      if (country) {
        where.country_id = country.country_id;
      }
    }

    if (Object.keys(where).length === 0) {
      return {
        status: 'error',
        message: 'Unable to interpret query',
      };
    }
    if (
      (searchQuery.page && isNaN(Number(searchQuery.page))) ||
      (searchQuery.limit && isNaN(Number(searchQuery.limit)))
    ) {
      return { status: 'error', message: 'Invalid query parameters' };
    }

    // Pagination
    const page = Math.max(1, Number(searchQuery.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchQuery.limit) || 10));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      status: 'success',
      page,
      limit,
      total,
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
