import { getDB } from "../db";
import { users } from "../db/schemas";
import { hashPassword } from "../lib/hash";
import { createPublicRouter } from "../lib/hono";

const usersData = [
  {
    email: "marcos@gmail.com",
    password: "pass123",
    name: "Marcos",
    role: "user",
  },
  {
    email: "admin@gmail.com",
    password: "pass123",
    name: "Martin",
    role: "admin",
  },
];

const routes = createPublicRouter();

routes.post("/", async (c) => {
  const db = getDB(c.env.DB);
  // solo si estamos en desarrollo
  if (c.env.ENVIRONMENT !== "development") {
    return c.json({ success: false, error: "No se puede ejecutar el seed en producción" }, 403);
  }

  for (const userData of usersData) {
    const passwordHash = await hashPassword(userData.password);
    await db
      .insert(users)
      .values({
        email: userData.email.toLowerCase(),
        passwordHash,
        name: userData.name || "",
        role: userData.role,
        emailVerified: true,
      })
      .onConflictDoNothing({ target: users.email });
  }

  // for (const challengeData of dataNewChallenges) {
  //   await db
  //     .insert(challenges)
  //     .values({
  //       ...challengeData,
  //       id: crypto.randomUUID(), // Explicitly generate ID to avoid defaultFn issues
  //     })
  //     .onConflictDoNothing({ target: challenges.key });
  // }
  return c.json({ success: true, message: "Challenges seeded successfully" });
});

export default routes;
