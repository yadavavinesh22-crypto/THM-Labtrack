import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const managerEmail = process.env.SEED_MANAGER_EMAIL;
  const managerPassword = process.env.SEED_MANAGER_PASSWORD;

  if (managerEmail && managerPassword) {
    const password = await bcrypt.hash(managerPassword, 12);
    await prisma.user.upsert({
      where: { email: managerEmail.toLowerCase() },
      update: { name: "Lab Manager", password, role: Role.MANAGER },
      create: {
        name: "Lab Manager",
        email: managerEmail.toLowerCase(),
        password,
        role: Role.MANAGER
      }
    });
    console.log(`Manager account ensured: ${managerEmail}`);
  } else {
    console.log("Set SEED_MANAGER_EMAIL and SEED_MANAGER_PASSWORD to create a manager.");
  }

  const count = await prisma.assignment.count();
  if (count === 0) {
    await prisma.assignment.createMany({
      data: [
        {
          title: "Linux Fundamentals",
          description: "Complete the assigned Linux fundamentals room and submit your room link with a screenshot of completion.",
          thmRoomUrl: "https://tryhackme.com/room/linuxfundamentals",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          title: "Web Fundamentals",
          description: "Complete the assigned web fundamentals room. Include a clear screenshot showing your completed progress.",
          thmRoomUrl: "https://tryhackme.com/room/webfundamentals",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      ]
    });
    console.log("Sample assignments created.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
