// console.log("Hiii Server")
import dotenv from 'dotenv';
dotenv.config();

// console.log("🚀 ~ dotenv.config() ~ session", process.env.SESSION_SECRET )

import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/auth.js';
import { createAsset, createAssetCategory, createDepartment, createSection, updateInventory } from './controller/schemaDataCreation/index.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { requestRouter } from './routes/requests.js';
import { transactionRouter } from './routes/transactions.js';
import generalRouter from './routes/general.js';
import { inventoryRouter } from './routes/inventory.js';
import { ewasteRouter } from './routes/ewaste.js';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 60 * 60 * 1000, // 1 hour
    },
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res)=>{
    res.json({
        message: "Server is running for Asset Management"
    });
})

app.post("/api/create-dept", createDepartment);
app.post("/api/create-section", createSection);
app.post("/api/create-asset-category", createAssetCategory);
app.post("/api/create-asset", createAsset);
app.post("/api/update-inventory",authMiddleware(['admin']), updateInventory);
app.use('/api/auth', authRouter);
app.use('/api/request', requestRouter)
app.use('/api/transaction', transactionRouter)
app.use('/api/general', generalRouter),
app.use('/api/inventory', inventoryRouter)
app.use('/api/ewaste', ewasteRouter)

mongoose.connect(process.env.MONGO_URL).then(() =>{
    console.log("Connected to MongoDB");
    app.listen(PORT, () => 
        console.log(`Server is running on port ${PORT}`)
    )
}).catch((err)=> console.log("Error connecting to MongoDB:", err));