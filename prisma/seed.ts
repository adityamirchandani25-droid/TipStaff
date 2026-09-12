import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

// Mirror src/lib/prisma.ts: @prisma/adapter-pg ignores the `?schema=` query
// param, so the target schema has to be passed as an explicit option or every
// query lands in `public`.
const connectionString = process.env.DATABASE_URL;

function databaseSchema(url?: string) {
  if (!url) return undefined;
  try {
    return new URL(url).searchParams.get("schema") ?? undefined;
  } catch {
    return undefined;
  }
}

const schema = databaseSchema(connectionString);
const adapter = new PrismaPg(
  { connectionString },
  schema ? { schema } : undefined,
);
const prisma = new PrismaClient({ adapter });

// All seeded accounts share this password so you can log in locally
// without hunting through the script for credentials.
const DEV_PASSWORD = "password123";

// Loosely centered on downtown Austin, TX so seeded providers/customers
// land at realistic, matchable distances from one another.
const ORIGIN = { lat: 30.2711, lng: -97.7437 };

function near(latOffset: number, lngOffset: number) {
  return { lat: ORIGIN.lat + latOffset, lng: ORIGIN.lng + lngOffset };
}

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.message.deleteMany();
  await prisma.jobStatusEvent.deleteMany();
  await prisma.job.deleteMany();
  await prisma.dispatchAttempt.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.address.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      role: "ADMIN",
      name: "Priya Nair",
      email: "admin@tipstaff.dev",
      phone: "+15125550100",
      passwordHash,
    },
  });

  const customers = await Promise.all(
    [
      { name: "Jordan Blake", email: "jordan@tipstaff.dev", phone: "+15125550101" },
      { name: "Sam Torres", email: "sam@tipstaff.dev", phone: "+15125550102" },
    ].map((c, i) =>
      prisma.user.create({
        data: {
          role: "CUSTOMER",
          name: c.name,
          email: c.email,
          phone: c.phone,
          passwordHash,
          addresses: {
            create: {
              label: "Home",
              line1: `${100 + i * 20} Congress Ave`,
              city: "Austin",
              state: "TX",
              postalCode: "78701",
              isDefault: true,
              ...near(0.01 * (i + 1), -0.01 * (i + 1)),
            },
          },
        },
      }),
    ),
  );

  const providerSeeds = [
    {
      name: "Mike Reyes",
      email: "mike.reyes@tipstaff.dev",
      categories: ["PLUMBING"] as const,
      rating: 4.9,
      ratingCount: 132,
      jobsCompleted: 140,
      offset: near(0.02, 0.015),
      approval: "APPROVED" as const,
      online: true,
    },
    {
      name: "Elena Cho",
      email: "elena.cho@tipstaff.dev",
      categories: ["ELECTRICAL", "APPLIANCE"] as const,
      rating: 4.8,
      ratingCount: 98,
      jobsCompleted: 101,
      offset: near(-0.015, 0.02),
      approval: "APPROVED" as const,
      online: true,
    },
    {
      name: "Darnell Ellis",
      email: "darnell.ellis@tipstaff.dev",
      categories: ["HVAC"] as const,
      rating: 4.7,
      ratingCount: 76,
      jobsCompleted: 80,
      offset: near(0.03, -0.02),
      approval: "APPROVED" as const,
      online: true,
    },
    {
      name: "Priya Shah",
      email: "priya.shah@tipstaff.dev",
      categories: ["LOCKSMITH"] as const,
      rating: 4.95,
      ratingCount: 210,
      jobsCompleted: 240,
      offset: near(-0.01, -0.03),
      approval: "APPROVED" as const,
      online: false,
    },
    {
      name: "Tom Baker",
      email: "tom.baker@tipstaff.dev",
      categories: ["HANDYMAN", "PEST"] as const,
      rating: 4.6,
      ratingCount: 54,
      jobsCompleted: 60,
      offset: near(0.008, 0.03),
      approval: "APPROVED" as const,
      online: true,
    },
    {
      name: "Grace Lin",
      email: "grace.lin@tipstaff.dev",
      categories: ["ROOFING", "HANDYMAN"] as const,
      rating: 4.85,
      ratingCount: 63,
      jobsCompleted: 65,
      offset: near(-0.025, -0.01),
      approval: "APPROVED" as const,
      online: true,
    },
    {
      name: "Alex Novak",
      email: "alex.novak@tipstaff.dev",
      categories: ["ELECTRICAL"] as const,
      rating: 0,
      ratingCount: 0,
      jobsCompleted: 0,
      offset: near(0.012, -0.008),
      approval: "PENDING" as const,
      online: false,
    },
  ];

  const providers = await Promise.all(
    providerSeeds.map((p) =>
      prisma.user
        .create({
          data: {
            role: "PROVIDER",
            name: p.name,
            email: p.email,
            phone: `+1512555${Math.floor(1000 + Math.random() * 8999)}`,
            passwordHash,
            provider: {
              create: {
                categories: [...p.categories],
                bio: `${p.name.split(" ")[0]} has been serving the Austin area for years.`,
                serviceRadiusMi: 15,
                approvalStatus: p.approval,
                isOnline: p.online,
                currentLat: p.offset.lat,
                currentLng: p.offset.lng,
                locationUpdatedAt: new Date(),
                rating: p.rating,
                ratingCount: p.ratingCount,
                jobsCompleted: p.jobsCompleted,
                certifications: {
                  create: {
                    name: `${p.categories[0]} License`,
                    issuer: "State of Texas",
                    verified: p.approval === "APPROVED",
                  },
                },
              },
            },
          },
          include: { provider: true },
        }),
    ),
  );

  // One completed job in the history so order-history, reviews, and admin
  // metrics views have something to render against.
  const [customer] = customers;
  const plumber = providers.find((p) => p.name === "Mike Reyes")!;
  const customerAddress = await prisma.address.findFirstOrThrow({
    where: { userId: customer.id },
  });

  const pastRequest = await prisma.serviceRequest.create({
    data: {
      customerId: customer.id,
      addressId: customerAddress.id,
      category: "PLUMBING",
      description: "Kitchen sink was leaking under the cabinet.",
      urgency: "TODAY",
      status: "MATCHED",
      priceEstimateLow: 120,
      priceEstimateHigh: 220,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
  });

  const pastJob = await prisma.job.create({
    data: {
      requestId: pastRequest.id,
      providerId: plumber.provider!.id,
      status: "COMPLETED",
      finalPrice: 165,
      tip: 20,
      matchedAt: pastRequest.createdAt,
      completedAt: new Date(pastRequest.createdAt.getTime() + 1000 * 60 * 90),
    },
  });

  await prisma.payment.create({
    data: {
      jobId: pastJob.id,
      amount: 165,
      tip: 20,
      status: "SUCCEEDED",
    },
  });

  await prisma.review.create({
    data: {
      jobId: pastJob.id,
      authorId: customer.id,
      providerId: plumber.provider!.id,
      rating: 5,
      comment: "Fast, tidy, explained everything. Would book again.",
    },
  });

  console.log("Seeded:");
  console.log(`  1 admin (${admin.email})`);
  console.log(`  ${customers.length} customers`);
  console.log(`  ${providers.length} providers (1 pending approval)`);
  console.log(`  1 completed job with review`);
  console.log(`\nAll accounts use the password: ${DEV_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
