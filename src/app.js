import express from 'express';
import authRoutes from "./routes/auth.routes.js";
import bookmarkRoutes from "./routes/bookmark.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import helmet from 'helmet';
import cors from 'cors';

const app = express();

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/admin', adminRoutes);

// Health check

app.use (errorHandler);
app.use(helmet());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
  }));
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'success',
        message: 'Server is healthy' });
});

// Error handler
app.use(errorHandler);

export default app;