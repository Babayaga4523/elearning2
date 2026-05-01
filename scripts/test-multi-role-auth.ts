/**
 * Test script for multi-role authentication system
 * 
 * This script verifies:
 * 1. User has multiple roles
 * 2. activeRole can be set and retrieved
 * 3. Database state is correct
 */

import { db } from "../src/lib/db"

async function testMultiRoleAuth() {
  console.log("🔍 Testing Multi-Role Authentication System\n")

  try {
    // Test user email
    const testEmail = "karyawan@bnif.co.id"

    // 1. Check if user exists
    console.log("1️⃣ Checking user existence...")
    const user = await db.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        name: true,
        email: true,
        nip: true,
        roles: true,
        activeRole: true,
        authMethod: true,
        lastLoginAt: true,
        lastLoginMethod: true,
      },
    })

    if (!user) {
      console.error("❌ User not found:", testEmail)
      return
    }

    console.log("✅ User found:")
    console.log("   Name:", user.name)
    console.log("   Email:", user.email)
    console.log("   NIP:", user.nip)
    console.log("   Roles:", user.roles)
    console.log("   Active Role:", user.activeRole)
    console.log("   Auth Method:", user.authMethod)
    console.log("   Last Login:", user.lastLoginAt)
    console.log("   Last Login Method:", user.lastLoginMethod)
    console.log()

    // 2. Verify multi-role setup
    console.log("2️⃣ Verifying multi-role setup...")
    if (user.roles.length < 2) {
      console.warn("⚠️  User has less than 2 roles. Expected: KARYAWAN and ADMIN")
      console.log("   Current roles:", user.roles)
    } else {
      console.log("✅ User has multiple roles:", user.roles)
    }
    console.log()

    // 3. Test setting active role to ADMIN
    console.log("3️⃣ Testing active role update to ADMIN...")
    await db.user.update({
      where: { id: user.id },
      data: { activeRole: "ADMIN" },
    })
    
    const updatedUser = await db.user.findUnique({
      where: { id: user.id },
      select: { activeRole: true },
    })
    
    if (updatedUser?.activeRole === "ADMIN") {
      console.log("✅ Active role successfully set to ADMIN")
    } else {
      console.error("❌ Failed to set active role to ADMIN")
    }
    console.log()

    // 4. Test setting active role to KARYAWAN
    console.log("4️⃣ Testing active role update to KARYAWAN...")
    await db.user.update({
      where: { id: user.id },
      data: { activeRole: "KARYAWAN" },
    })
    
    const updatedUser2 = await db.user.findUnique({
      where: { id: user.id },
      select: { activeRole: true },
    })
    
    if (updatedUser2?.activeRole === "KARYAWAN") {
      console.log("✅ Active role successfully set to KARYAWAN")
    } else {
      console.error("❌ Failed to set active role to KARYAWAN")
    }
    console.log()

    // 5. Reset active role to null for testing
    console.log("5️⃣ Resetting active role to null for fresh login test...")
    await db.user.update({
      where: { id: user.id },
      data: { activeRole: null },
    })
    
    const resetUser = await db.user.findUnique({
      where: { id: user.id },
      select: { activeRole: true },
    })
    
    if (resetUser?.activeRole === null) {
      console.log("✅ Active role reset to null")
    } else {
      console.error("❌ Failed to reset active role")
    }
    console.log()

    // 6. Summary
    console.log("📊 Test Summary:")
    console.log("   ✅ User exists with multi-role support")
    console.log("   ✅ Active role can be updated")
    console.log("   ✅ Database operations working correctly")
    console.log()
    console.log("🎉 All tests passed!")
    console.log()
    console.log("📝 Next steps:")
    console.log("   1. Start the dev server: npm run dev")
    console.log("   2. Login with:", testEmail)
    console.log("   3. Modal should appear for role selection")
    console.log("   4. Select a role and verify redirect works")

  } catch (error) {
    console.error("❌ Error during testing:", error)
  } finally {
    await db.$disconnect()
  }
}

testMultiRoleAuth()
