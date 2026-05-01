import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      )
    }

    const { role } = await req.json()

    // Validate role
    const validRoles = ["KARYAWAN", "ADMIN", "SUPER_ADMIN"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role provided" },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        roles: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user has this role
    if (!user.roles.includes(role as any)) {
      return NextResponse.json(
        { error: "User does not have access to this role" },
        { status: 403 }
      )
    }

    // Update user's active role
    await db.user.update({
      where: { id: user.id },
      data: { 
        activeRole: role as any,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true, 
      role,
      message: "Role updated successfully" 
    })
  } catch (error) {
    console.error("Error setting role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
