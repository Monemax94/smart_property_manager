import { Container } from 'inversify';
import { Model } from 'mongoose';
import { TYPES } from './types';


import CategoryModel, {ICategory } from '../models/Category';

// order dependencies
import { OrderService } from '../services/OrderService';
import { OrderController } from '../controllers/OrderController';
import { OrderRepository } from '../repositories/OrderRepository';
import {OrderModel, IOrder } from '../models/OrderModel';

//notification

import { NotificationRepository } from "../repositories/NotificationRepository";
import { NotificationService } from "../services/NotificationService";


// User dependencies
import { UserService } from '../services/UserService';
import { UserController } from '../controllers/UserController';
import { UserRepository } from '../repositories/UserRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { UserModel, IUser, IUserDocument } from '../models/User';

// Profile dependencies
import { ProfileService } from '../services/ProfileService';
import { ProfileController } from '../controllers/ProfileController';
import { ProfileRepository } from '../repositories/ProfileRepository';
import ProfileModel, {IProfile } from '../models/Profile';

// Authservices
import { AuthController } from '../controllers/AuthController';
import { MailService } from '../services/MailService';
import TokenService from '../services/TokenService';
import { AuthService } from '../services/AuthService';
import { ReviewController } from '../controllers/ReviewController';
import { ReviewService } from '../services/ReviewService';
import { IVendorRepository } from '../interfaces/IVendorRepository';

import { PlanService } from '../services/PlanService';
import { PlanRepository } from '../repositories/PlanRepository';
import { PlanController } from '../controllers/PlanController';

import { StripeWebhookController } from '../controllers/StripeWebhookController';
import { BuyerRepository } from '../repositories/BuyerRepository';
import { DisputeRepository } from '../repositories/DisputeRepository';
import { DisputeService } from '../services/DisputeService';
import { IDisputeRepository } from '../interfaces/IDisputeRepository';
import { DisputeController } from '../controllers/DisputeController';
import { SessionService } from '../services/SessionService';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { ActivityLogService } from '../services/ActivityLogService';
import { ActivityLogController } from '../controllers/ActivityLogController';
import { CartController } from '../customer/controllers/CartController';
import { AddressController } from '../controllers/AddressController';
import { AddressRepository } from '../repositories/AddressRepository';
import { AddressService } from '../services/AddressService';
import { OrderTrackingController } from '../controllers/OrderTrackingController';
import { OrderTrackingRepository, IOrderTrackingRepository } from '../repositories/OrderTrackingRepository';
import { OrderTrackingService } from '../services/OrderTrackingService';
import { WishlistController } from '../customer/controllers/WishlistController';
import { IWishlistRepository, WishlistRepository } from '../repositories/WishlistRepository';
import { IWishlistService, WishlistService } from '../services/WishlistService';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { PaymentService } from '../services/paymentService';


import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { AnalyticsService } from '../services/AnalyticsService';
import { NotificationPreferenceRepository } from '../repositories/NotificationPreferenceRepository';
import { ApplicationPreferenceRepository } from '../repositories/ApplicationPreferenceRepository';
import { PreferenceService } from '../services/PreferenceService';
import { AddressModel, IAddress } from '../models/Address';
import { ProductRequestController } from '../customer/controllers/ProductRequestController';
import { OrderRequestRepository } from '../repositories/OrderRequestRepository';

import { NewsLetterController } from '../controllers/NewsLetterController';
import { NewsLetterService } from '../services/NewsLetterService';
import { NewsLetterRepository } from '../repositories/NewsLetterRepository';
import { VendorProductController } from '../vendor/controller/ProductController';
import { VendorAnalyticsController } from '../vendor/controller/VendorAnalyticsController';
import { VendorOrderController } from '../vendor/controller/VendorOrderController';
import { VendorProfileController } from '../vendor/controller/VendorProfileController';
import { StripeWalletRepository } from '../repositories/StripeWalletRepository';
import { StripeWalletService } from '../services/StripeWalletService';
import { CarouselRepository } from '../repositories/CarouselRepository';
import { CarouselService } from '../services/CarouselService';
import { CarouselController } from '../controllers/CarouselController';

import { GoogleAuthService } from '../services/google.auth.service';
import { CurrencyRepository } from '../repositories/CurrencyRepository';
import { CurrencyController } from '../controllers/CurrencyController';
import { CurrencyService } from '../services/CurrencyService';
import { ITwoFactorRepository, ITwoFactorService } from '../interfaces/ITwoFactor';
import { TwoFactorRepository } from '../repositories/TwoFactorRepository';
import { TwoFactorService } from '../services/TwoFactorService';
import { PropertyRepository } from '../repositories/PropertyRepository';
import { PropertyService } from '../services/PropertyService';
import { PropertyController } from '../controllers/PropertyController';


const container = new Container();


container.bind<VendorProductController>(TYPES.VendorProductController).to(VendorProductController);
container.bind<VendorOrderController>(TYPES.VendorOrderController).to(VendorOrderController);
container.bind<ProductRequestController>(TYPES.ProductRequestController).to(ProductRequestController);
container.bind<OrderRequestRepository>(TYPES.OrderRequestRepository).to(OrderRequestRepository);


// Category bindings
container.bind<Model<ICategory>>(TYPES.CategoryModel).toConstantValue(CategoryModel);

// profile bindgs
container.bind<Model<IProfile>>(TYPES.ProfileModel).toConstantValue(ProfileModel);
container.bind<ProfileRepository>(TYPES.ProfileRepository).to(ProfileRepository);
container.bind<ProfileService>(TYPES.ProfileService).to(ProfileService);
container.bind<ProfileController>(TYPES.ProfileController).to(ProfileController);


// User bindings
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<Model<IUserDocument>>(TYPES.UserModel).toConstantValue(UserModel);

// order bindings
container.bind<OrderRepository>(TYPES.OrderRepository).to(OrderRepository);
container.bind<OrderService>(TYPES.OrderService).to(OrderService);
container.bind<OrderController>(TYPES.OrderController).to(OrderController);
container.bind<Model<IOrder>>(TYPES.OrderModel).toConstantValue(OrderModel);

// Repository Bindings
container.bind<IOrderTrackingRepository>(TYPES.OrderTrackingRepository)
  .to(OrderTrackingRepository)
  .inSingletonScope();

// Service Bindings
container.bind<OrderTrackingService>(TYPES.OrderTrackingService)
  .to(OrderTrackingService)
  .inSingletonScope();

// Controller Bindings
container.bind<OrderTrackingController>(TYPES.OrderTrackingController)
  .to(OrderTrackingController)
  .inSingletonScope();

// auths bindings
container.bind<SessionService>(TYPES.SessionService).to(SessionService);
container.bind<AuthService>(TYPES.AuthService).to(AuthService);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<MailService>(TYPES.MailService).to(MailService);

// auths bindings
container.bind<ReviewController>(TYPES.ReviewController).to(ReviewController);
container.bind<ReviewService>(TYPES.ReviewService).to(ReviewService);
container.bind<TokenService>(TYPES.TokenService).to(TokenService);
container.bind<GoogleAuthService>(TYPES.GoogleAuthService).to(GoogleAuthService);


container.bind<VendorProfileController>(TYPES.VendorProfileController).to(VendorProfileController);
container.bind<VendorAnalyticsController>(TYPES.VendorAnalyticsController).to(VendorAnalyticsController);

// Plan bindings
container.bind<PlanRepository>(TYPES.PlanRepository).to(PlanRepository);
container.bind<PlanService>(TYPES.PlanService).to(PlanService);
container.bind<PlanController>(TYPES.PlanController).to(PlanController);
// Plan bindings


// Featured Product bindings
container.bind<NewsLetterController>(TYPES.NewsLetterController).to(NewsLetterController);
container.bind<NewsLetterService>(TYPES.NewsLetterService).to(NewsLetterService);
container.bind<NewsLetterRepository>(TYPES.NewsLetterRepository).to(NewsLetterRepository);
// Carousel bindings
container.bind<CarouselRepository>(TYPES.CarouselRepository).to(CarouselRepository);
container.bind<CarouselService>(TYPES.CarouselService).to(CarouselService);
container.bind<CarouselController>(TYPES.CarouselController).to(CarouselController);

container.bind<BuyerRepository>(TYPES.BuyerRepository).to(BuyerRepository);
// wallet
container.bind<StripeWalletRepository>(TYPES.StripeWalletRepository).to(StripeWalletRepository);
container.bind<StripeWalletService>(TYPES.StripeWalletService).to(StripeWalletService);
// notifications
container.bind<NotificationRepository>(TYPES.NotificationRepository).to(NotificationRepository);
container.bind<NotificationPreferenceRepository>(TYPES.NotificationPreferenceRepository).to(NotificationPreferenceRepository);
container.bind<ApplicationPreferenceRepository>(TYPES.ApplicationPreferenceRepository).to(ApplicationPreferenceRepository);
container.bind<PreferenceService>(TYPES.PreferenceService).to(PreferenceService);
container.bind<NotificationService>(TYPES.NotificationService).to(NotificationService);

container.bind<CurrencyRepository>(TYPES.CurrencyRepository).to(CurrencyRepository);
container.bind<CurrencyController>(TYPES.CurrencyController).to(CurrencyController);
container.bind<CurrencyService>(TYPES.CurrencyService).to(CurrencyService);
// cart 
container.bind<CartController>(TYPES.CartController).to(CartController);

// property 
container.bind<PropertyRepository>(TYPES.CartController).to(PropertyRepository);
container.bind<PropertyService>(TYPES.PropertyService).to(PropertyService);
container.bind<PropertyController>(TYPES.PropertyController).to(PropertyController);

// payments 
container.bind<StripeWebhookController>(TYPES.StripeWebhookController).to(StripeWebhookController);
container.bind<PaymentRepository>(TYPES.PaymentRepository).to(PaymentRepository);
container.bind<PaymentService>(TYPES.PaymentService).to(PaymentService);

// wishlist
container.bind<IWishlistRepository>(TYPES.WishlistRepository)
    .to(WishlistRepository)
    .inSingletonScope();
container.bind<IWishlistService>(TYPES.WishlistService)
    .to(WishlistService)
    .inSingletonScope();
container.bind<WishlistController>(TYPES.WishlistController)
    .to(WishlistController)
    .inSingletonScope();
// wishlist
container.bind<ITwoFactorRepository>(TYPES.TwoFactorRepository)
    .to(TwoFactorRepository)
    .inSingletonScope();
container.bind<ITwoFactorService>(TYPES.TwoFactorService)
    .to(TwoFactorService)
    .inSingletonScope();

// address 
container.bind<AddressController>(TYPES.AddressController).to(AddressController);
container.bind<AddressRepository>(TYPES.AddressRepository).to(AddressRepository);
container.bind<AddressService>(TYPES.AddressService).to(AddressService);
container.bind<Model<IAddress>>(TYPES.AddressModel).toConstantValue(AddressModel);
// disputes bindings
container.bind<IDisputeRepository>(TYPES.DisputeRepository).to(DisputeRepository);
container.bind<DisputeService>(TYPES.DisputeService).to(DisputeService);
container.bind<DisputeController>(TYPES.DisputeController).to(DisputeController);

container.bind<AnalyticsRepository>(TYPES.AnalyticsRepository).to(AnalyticsRepository);
container.bind<AnalyticsService>(TYPES.AnalyticsService).to(AnalyticsService);




container.bind<ActivityLogRepository>(TYPES.ActivityLogRepository)
  .to(ActivityLogRepository)
  .inSingletonScope();
container.bind<ActivityLogService>(TYPES.ActivityLogService)
  .to(ActivityLogService)
  .inSingletonScope();
container.bind<ActivityLogController>(TYPES.ActivityLogController)
  .to(ActivityLogController)
  .inSingletonScope();

export { container };
