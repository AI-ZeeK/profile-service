/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient as PrismaMainClient } from '@prisma/client';
import { permissions } from './organization_permissions';
import { ROLES_ENUM } from '@djengo/proto-contracts';

const prisma = new PrismaMainClient();

async function main() {
  // Seed main database
  await seedMainDatabase();
}
const roles = [
  {
    role_name: ROLES_ENUM.BUSINESS_USER,
    description:
      'Works under a company or agency and manages its operations on the platform.',
  },
  {
    role_name: ROLES_ENUM.PLATFORM,
    description: 'Manages platform-level features and settings.',
  },
  {
    role_name: ROLES_ENUM.CLIENT,
    description: 'Books and uses services (e.g., houses, Airbnbs, hotels).',
  },
  {
    role_name: ROLES_ENUM.STAFF,
    description:
      'Works under a company or agency to manage day-to-day operations.',
  },
  {
    role_name: ROLES_ENUM.AGENCY,
    description: 'Manages rental properties (e.g., Airbnbs, houses).',
  },
];

async function seedMainDatabase() {
  try {
    for (const role of roles) {
      const _role = await prisma.role.upsert({
        where: {
          role_name: role.role_name,
        },
        update: {},
        create: {
          role_name: role.role_name,
          description: role.description,
        },
      });
      console.log(`role:- ${_role.role_name} seeded successfully`);
    }
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
