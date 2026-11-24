import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/user-session";

async function main() {
  const adminEmail = (
    process.env.ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_IMPRESSUM_EMAIL ||
    "admin@germanjobspro.com"
  ).trim().toLowerCase();
  const adminName = process.env.ADMIN_NAME || "Administrator";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD environment variable is required.");
  }

  console.log(`Checking admin account for: ${adminEmail}...`);

  const hashedPassword = await hashPassword(adminPassword);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash: hashedPassword,
      plan: "PRO",
      emailVerified: true,
      aiCredits: 100,
    },
    update: {
      name: adminName,
      passwordHash: hashedPassword,
      plan: "PRO",
      emailVerified: true,
    },
  });

  console.log("✅ Admin user upserted successfully:", {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    emailVerified: user.emailVerified,
  });
}

main()
  .catch((err) => {
    console.error("❌ Failed to upsert admin user:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
