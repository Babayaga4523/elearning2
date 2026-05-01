import { db } from "../src/lib/db"

async function resetActiveRole() {
  const email = "karyawan@bnif.co.id"
  
  console.log("🔄 Resetting activeRole for:", email)
  
  const user = await db.user.update({
    where: { email },
    data: { activeRole: null },
    select: {
      name: true,
      email: true,
      roles: true,
      activeRole: true,
    }
  })
  
  console.log("✅ Reset complete!")
  console.log("User state:")
  console.log(JSON.stringify(user, null, 2))
  console.log("\n📝 Next: Login with this account and modal should appear")
  
  await db.$disconnect()
}

resetActiveRole()
