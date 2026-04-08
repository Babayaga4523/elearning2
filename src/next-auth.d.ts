import { DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  role: "ADMIN" | "KARYAWAN";
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}
