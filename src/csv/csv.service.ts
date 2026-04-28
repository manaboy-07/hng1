import { Injectable } from '@nestjs/common';
import { Parser } from 'json2csv';
import { QueryDto } from 'src/dto/Query.dto';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CsvService {
  constructor(private prismaService: PrismaService) {}
  async exportProfiles(query: QueryDto) {
    const sortMap: Record<
      string,
      keyof Prisma.ProfileOrderByWithRelationInput
    > = {
      age: 'age',
      created_at: 'createdAt',
      gender_probability: 'gender_probability',
    };

    const allowedOrder = ['asc', 'desc'] as const;

    const {
      age_group,
      country_id,
      gender,
      max_age,
      min_age,
      max_gender_probability,
      min_gender_probability,
      min_country_probability,

      order,
      sort_by,
    } = query;

    const queries: Prisma.ProfileWhereInput = {
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

      ...(min_age !== undefined || max_age !== undefined
        ? {
            age: {
              ...(min_age !== undefined && { gte: Number(min_age) }),
              ...(max_age !== undefined && { lte: Number(max_age) }),
            },
          }
        : {}),

      ...(min_gender_probability !== undefined ||
      max_gender_probability !== undefined
        ? {
            gender_probability: {
              ...(min_gender_probability !== undefined && {
                gte: Number(min_gender_probability),
              }),
              ...(max_gender_probability !== undefined && {
                lte: Number(max_gender_probability),
              }),
            },
          }
        : {}),

      ...(min_country_probability !== undefined && {
        country_probability: {
          gte: Number(min_country_probability),
        },
      }),
    };

    const normalizedSortBy = sort_by?.toLowerCase();

    if (sort_by && !sortMap[normalizedSortBy as keyof typeof sortMap]) {
      return {
        status: 'error',
        message: 'Invalid query parameters',
      };
    }

    if (order && !allowedOrder.includes(order as any)) {
      return {
        status: 'error',
        message: 'Invalid query parameters',
      };
    }

    let orderBy: Prisma.UserOrderByWithRelationInput;

    if (sort_by) {
      const key = sortMap[normalizedSortBy as keyof typeof sortMap];

      orderBy = {
        [key]: (order || 'desc') as Prisma.SortOrder,
      };
    } else {
      orderBy = {
        createdAt: 'desc',
      };
    }

    const profiles = await this.prismaService.profile.findMany({
      where: queries,
      orderBy,
    });

    //format csv
    const formatted = profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      gender: profile.gender,
      gender_probability: profile.gender_probability,
      age: profile.age_group,
      age_group: profile.age_group,
      country_id: profile.country_id,
      country_name: profile.country_name,
      country_probability: profile.country_probability,
      created_at: profile.createdAt,
    }));

    const fields = [
      'id',
      'name',
      'gender',
      'gender_probability',
      'age',
      'age_group',
      'country_id',
      'country_name',
      'country_probability',
      'created_at',
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(formatted);

    return csv;
  }
}
