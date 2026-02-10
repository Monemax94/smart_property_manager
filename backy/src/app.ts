import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { errors as celebrateErrors } from 'celebrate';
import swaggerUi from 'swagger-ui-express';
import openApiSpec from "./openapi.json"
import { CORS_ORIGINS, MONGO_URI, NODE_ENV } from "./secrets"
import { ApiError } from './utils/ApiError';
import ProductRoutes from './routes/ProductRoutes';
import DisputeRoutes from './routes/DisputeRoutes';
import CategoryRoutes from './routes/CategoryRoutes';
import UserRoutes from './routes/UserRoutes';
import ProfileRoutes from './routes/ProfileRoutes';
import AuthRoutes from './routes/AuthRoutes';
import OrderRoutes from './routes/OrderRoutes';
import CarrieerRoutes from './routes/CarieerRoutes';
import ReviewRoutes from './routes/ReviewRoutes';
import ActivityLogRoutes from './routes/ActivityLogRoutes';
import CustomersRoutes from './customer/routes/IndexRoutes';
import AddressRoutes from './routes/AddressRoutes';
import PaymentRoutes from './routes/WebHook';
import NinVerificationRoutes from './routes/NinRoutes';
import NewsletterRoute from './routes/NewsletterRoute';
import VendorRoutes from './vendor/routes/IndexRoutes';
import WalletRoute from './routes/WalletRoute';
import CarouselRoutes from './routes/CarouselRoutes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sessionConfig } from './config/session.config';
import CurrencyRoutes from './routes/CurrencyRoutes';
import logger from './utils/loggers';
import multer from 'multer';
import PropertyRoutes from './routes/PropertyRoutes';




class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
    this.setupRoutes();
    this.setupDatabase();
    this.handleGracefulShutdown();
    this.errorHandler();
  }

  private config(): void {
    const isProd = NODE_ENV === 'production';
    this.app.set('trust proxy', 1);
    // Security headers
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false,
      })
    );
    this.app.use(sessionConfig);
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200, // requests per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
      },
    });
    this.app.use('/api', limiter);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    // this.app.use(
    //   cors({
    //     origin: '*',
    //     credentials: true,
    //     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    //     allowedHeaders: ['Content-Type', 'Authorization'],
    //   })
    // );

    // Parse and clean origins
    const allowedOrigins = CORS_ORIGINS
      ? CORS_ORIGINS.split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0)
      : [];
    // Log configuration on startup
    logger.info('CORS Configuration', {
      isProd,
      allowedOrigins,
      raw: CORS_ORIGINS,
    });
    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Log every CORS request for debugging
          logger.info('CORS Request', {
            origin,
            isProd,
            allowedOrigins,
          });

          // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
          if (!origin) {
            logger.info('CORS: Allowing request with no origin');
            return callback(null, true);
          }

          // Allow all origins in development
          if (!isProd) {
            logger.info('CORS: Allowing origin (dev mode)', { origin });
            return callback(null, true);
          }

          // Check if origin is allowed in production
          if (allowedOrigins.includes(origin)) {
            logger.info('CORS: Origin allowed', { origin });
            return callback(null, true);
          }

          // Check with trailing slash removed (common mismatch)
          const originWithoutSlash = origin.endsWith('/')
            ? origin.slice(0, -1)
            : origin;

          if (allowedOrigins.includes(originWithoutSlash)) {
            logger.info('CORS: Origin allowed (without trailing slash)', { origin });
            return callback(null, true);
          }

          // Check with trailing slash added (another common mismatch)
          const originWithSlash = !origin.endsWith('/')
            ? `${origin}/`
            : origin;

          if (allowedOrigins.includes(originWithSlash)) {
            logger.info('CORS: Origin allowed (with trailing slash)', { origin });
            return callback(null, true);
          }

          // Origin not allowed
          logger.error('CORS: Origin blocked', {
            origin,
            allowedOrigins,
            isProd,
          });

          return callback(
            new ApiError(403, `CORS policy: Origin ${origin} is not allowed`)
          );
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        maxAge: 600, // Cache preflight requests for 10 minutes
      })
    );
    // Handle preflight requests explicitly
    this.app.options('*', cors());
    this.app.use(celebrateErrors());
  }

  private setupRoutes(): void {
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
    this.app.get('/swagger-json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(openApiSpec);
    });

    this.app.get('/', (_, res) => {
      return res.send("welcome to Qartt");
    });

    this.app.get('/health', async (req: Request, res: Response) => {
      const mongoState = mongoose.connection.readyState;

      const mongoStatusMap: Record<number, string> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      const isHealthy = mongoState === 1;

      return res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        status: isHealthy ? 'ok' : 'degraded',
        service: 'Qartt API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          type: 'mongodb',
          status: mongoStatusMap[mongoState] || 'unknown',
          ready: isHealthy,
        },
      });
    });
    this.app.use('/api/users', UserRoutes);
    this.app.use('/api/carousels', CarouselRoutes);
    this.app.use('/api/profile', ProfileRoutes);
    this.app.use('/api/properties', PropertyRoutes);
    this.app.use('/api/auth', AuthRoutes);
    this.app.use('/api/currency-code', CurrencyRoutes);
    this.app.use('/api/logs', ActivityLogRoutes);
    this.app.use('/api/disputes', DisputeRoutes);
    this.app.use('/api/products', ProductRoutes);
    this.app.use('/api/wallet', WalletRoute);
    this.app.use('/api/carrieer', CarrieerRoutes);
    this.app.use('/api/categories', CategoryRoutes);
    this.app.use('/api/orders', OrderRoutes);
    this.app.use('/api/reviews', ReviewRoutes);
    this.app.use('/api/customers', CustomersRoutes);
    this.app.use('/api/vendors', VendorRoutes);
    this.app.use('/api/addresses', AddressRoutes);
    this.app.use('/api/payments', PaymentRoutes);
    this.app.use('/api/newsletter', NewsletterRoute);
    this.app.use('/api/nin-verification', NinVerificationRoutes);

    // 404 handler
    this.app.use('*', (_, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Validation error handler (celebrate/joi)
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err.joi) {
        const details = err.joi.details.map((d: any) => ({
          field: d.context?.label || d.context?.key,
          message: d.message.replace(/["]/g, '')
        }));
        return res.status(400).json({
          error: 'Validation failed',
          message: 'One or more fields are invalid or missing.',
          details
        });
      }
      next(err);
    });
  }

  private errorHandler(): void {
    // Final catch-all error handler that forces JSON output
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      logger.error("ErrorHandler:", err);

      if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          errors: err.data?.errors || [],
          details: err.data?.details || null,
          code: err.data?.code || 'API_ERROR'
        });
      }
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json(
            new ApiError(413, 'File size exceeds the limit')
          );
        }
        // Handle other Multer errors
        return res.status(400).json(
          new ApiError(400, err.message)
        );
      }

      // Handle other errors
      if (err instanceof ApiError) {
        return res.status(err.statusCode).json(err);
      }

      // fallback internal server error
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message || "Something went wrong"
      });
    });
  }

  private handleGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.warn(`Received ${signal}. Shutting down gracefully...`);
      await mongoose.connection.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  private setupDatabase(): void {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connect(MONGO_URI || "", {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
  }


  public start(port: number): void {
    this.app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  }
}

export default App;
