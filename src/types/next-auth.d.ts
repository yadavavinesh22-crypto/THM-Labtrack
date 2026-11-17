import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "MANAGER";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: "STUDENT" | "MANAGER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string | null;
    role?: "STUDENT" | "MANAGER";
  }
}
