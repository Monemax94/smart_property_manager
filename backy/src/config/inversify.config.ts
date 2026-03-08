import { Container } from 'inversify';
import { Model } from 'mongoose';
import { TYPES } from './types';


import CategoryModel, {ICategory } from '../models/Category';


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
import { ReviewService } from '../services/ReviewService';

import { SessionService } from '../services/SessionService';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { ActivityLogService } from '../services/ActivityLogService';
import { ActivityLogController } from '../controllers/ActivityLogController';
import { AddressController } from '../controllers/AddressController';
import { AddressRepository } from '../repositories/AddressRepository';
import { AddressService } from '../services/AddressService';
import { IWishlistRepository, WishlistRepository } from '../repositories/WishlistRepository';
import { IWishlistService, WishlistService } from '../services/WishlistService';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { PaymentService } from '../services/paymentService';


import { NotificationPreferenceRepository } from '../repositories/NotificationPreferenceRepository';
import { ApplicationPreferenceRepository } from '../repositories/ApplicationPreferenceRepository';
import { PreferenceService } from '../services/PreferenceService';
import { AddressModel, IAddress } from '../models/Address';



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
import { PaystackService } from '../services/PaystackServices';
import { WishlistController } from '../controllers/WishlistController';
import { PaymentController } from '../controllers/PaymentController';


const container = new Container();


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



// auths bindings
container.bind<SessionService>(TYPES.SessionService).to(SessionService);
container.bind<AuthService>(TYPES.AuthService).to(AuthService);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<MailService>(TYPES.MailService).to(MailService);

container.bind<TokenService>(TYPES.TokenService).to(TokenService);
container.bind<GoogleAuthService>(TYPES.GoogleAuthService).to(GoogleAuthService);


// Carousel bindings
container.bind<CarouselRepository>(TYPES.CarouselRepository).to(CarouselRepository);
container.bind<CarouselService>(TYPES.CarouselService).to(CarouselService);
container.bind<CarouselController>(TYPES.CarouselController).to(CarouselController);

// wallet
container.bind<StripeWalletRepository>(TYPES.StripeWalletRepository).to(StripeWalletRepository);
container.bind<StripeWalletService>(TYPES.StripeWalletService).to(StripeWalletService);
container.bind<PaystackService>(TYPES.PaystackService).to(PaystackService);
// notifications
container.bind<NotificationRepository>(TYPES.NotificationRepository).to(NotificationRepository);
container.bind<NotificationPreferenceRepository>(TYPES.NotificationPreferenceRepository).to(NotificationPreferenceRepository);
container.bind<ApplicationPreferenceRepository>(TYPES.ApplicationPreferenceRepository).to(ApplicationPreferenceRepository);
container.bind<PreferenceService>(TYPES.PreferenceService).to(PreferenceService);
container.bind<NotificationService>(TYPES.NotificationService).to(NotificationService);

container.bind<PropertyService>(TYPES.PropertyService).to(PropertyService);
container.bind<PropertyRepository>(TYPES.PropertyRepository).to(PropertyRepository);
container.bind<PaymentController>(TYPES.PaymentController).to(PaymentController);
container.bind<CurrencyRepository>(TYPES.CurrencyRepository).to(CurrencyRepository);
container.bind<CurrencyController>(TYPES.CurrencyController).to(CurrencyController);
container.bind<CurrencyService>(TYPES.CurrencyService).to(CurrencyService);

// property 
container.bind<PropertyRepository>(TYPES.CartController).to(PropertyRepository);
container.bind<PropertyController>(TYPES.PropertyController).to(PropertyController);

// payments 
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