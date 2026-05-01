import { db } from "../src/lib/db"

async function checkActiveRole() {
  const user = await db.user.findUnique({
    where: { email: "karyawan@bnif.co.id" },
    select: { 
      name: true,
      email: true,
      activeRole: true, 
      roles: true 
    }
  })
  
  console.log("Current user state:")
  console.log(JSON.stringify(user, null, 2))
  
  await db.$disconnect()
}

checkActiveRole()
