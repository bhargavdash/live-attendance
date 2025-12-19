import express from 'express'
import mongoose from 'mongoose';
import userRouter from './routes/userRoutes';
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config();

const MONGO_URI = process.env.MONGO_URI ?? "";
const app = express();

app.use(express.json());
app.use(cors());

// establish db connection 
mongoose.connect(MONGO_URI).then(() => console.log("DB connected !!"));

app.get("/health", (req, res) => {
    res.send("Server is running healthy!!");
})

app.use('/user', userRouter);

app.get("/username", (req, res) => {
    res.send("Welcome username to my app");
})

app.listen(3000, () => {
    console.log("Server is running in port 3000");
})