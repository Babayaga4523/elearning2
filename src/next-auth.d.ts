import { DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  id: string;
  role: "ADMIN" | "KARYAWAN" | "SUPER_ADMIN"; // Legacy single role field
  roles: ("ADMIN" | "KARYAWAN" | "SUPER_ADMIN")[]; // New multi-role field
  activeRole: "ADMIN" | "KARYAWAN" | "SUPER_ADMIN" | null; // Currently selected role
  nip?: string | null;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}
