import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const uri = process.env.MONGODB_URI

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const users = db.collection("users")

    const user = await users.findOne({ email })
    if (!user) {
      await client.close()
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      await client.close()
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    await client.close()

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
