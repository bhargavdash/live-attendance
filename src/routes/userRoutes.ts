import { Router } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "../database/db";
import { z } from "zod";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const userRouter = Router();

userRouter.get("/health", (req, res) => {
  res.send("User route is healthy");
});

userRouter.post("/signin", async (req, res) => {
  try {
    // 1. parse username and password from request
    const { email, password } = req.body;

    // 2. find username in DB
    const user = await UserModel.findOne({ email: email });

    // 3. If user not found then return that user is not there and redirect to sign up
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User not found"
      })
    }
    // 4. If user is found then verify the password
    const correctPassword = await bcrypt.compare(password, user.password);
    if (!correctPassword) {
      return res.status(400).json({
        success: false,
        error: "Invalid email or password"
      })
    }
    // 5. If wrong password , return that password is wrong

    // 6. If correct password , then create JWT token, and return that to user.
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      JWT_SECRET
    );
    return res.status(200).json({
      success: true,
      data: {
        token
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      success: false,
      error: err,
    });
  }
});

userRouter.post("/signup", async (req, res) => {
  try {
    // 1. parse username and password from request body
    const { name, email, password, role } = req.body;

    // 2. Check if user already exists in the DB, if yes then return
    const user = await UserModel.findOne({ email: email });

    if (user) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // with salt

    // 4. Store it in the DB
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.log(err);
    return res.send(err);
  }
});

export default userRouter;
