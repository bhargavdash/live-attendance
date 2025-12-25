import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET ?? "";

export interface CustomRequest extends Request {
    userId?: string;
    role?: string
}
export const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction): void => {
    const token = req.headers['authorization'];
    
    if(!token){
        res.status(400).json({
            success: false,
            error: "Auth token not found"
        })
        return;
    }
    const decodedToken = jwt.verify(token, JWT_SECRET) as {userId: string, role: string};

    if(!decodedToken){
        res.status(401).json({
            success: false,
            error: "Authorization denied"
        })
    }
    req.userId = decodedToken.userId;
    req.role = decodedToken.role;
    next();
}