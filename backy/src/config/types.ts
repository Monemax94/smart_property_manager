export const TYPES = {
    //product types
    ProductRepository: Symbol.for('ProductRepository'),
    ProductService: Symbol.for('ProductService'),
    ProductController: Symbol.for('ProductController'),
    VendorProductController: Symbol.for('VendorProductController'),
    PayoutBankRepository: Symbol.for('PayoutBankRepository'),
    PayoutBankService: Symbol.for('PayoutBankService'),
    CategoryRepository: Symbol.for('CategoryRepository'),
    CategoryService: Symbol.for('CategoryService'),
    CategoryController: Symbol.for('CategoryController'),
    CurrencyRepository: Symbol.for('CurrencyRepository'),
    CurrencyService: Symbol.for('CurrencyService'),
    CurrencyController: Symbol.for('CurrencyController'),
    CategoryModel: Symbol.for('CategoryModel'),


    // user types
    UserRepository: Symbol.for('UserRepository'),
    AnalyticsRepository: Symbol.for('AnalyticsRepository'),
    AnalyticsService: Symbol.for('AnalyticsService'),
    IUserRepository: Symbol.for('IUserRepository'),
    UserService: Symbol.for('UserService'),
    UserController: Symbol.for('UserController'),
    UserModel: Symbol.for('UserModel'),

    // user profile types
    ProfileRepository: Symbol.for('ProfileRepository'),
    ProfileService: Symbol.for('ProfileService'),
    ProfileController: Symbol.for('ProfileController'),
    ProfileModel: Symbol.for('ProfileModel'),
    SearchService: Symbol.for('SearchService'),

    // mail services
    MailService: Symbol.for('MailService'),
    AuthService: Symbol.for('AuthService'),
    AppleAuthService: Symbol.for('AppleAuthService'),
    GoogleAuthService: Symbol.for('GoogleAuthService'),
    SessionService: Symbol.for('SessionService'),
    AuthController: Symbol.for('AuthController'),

    // review
    ReviewRepository: Symbol.for('ReviewRepository'),
    ReviewService: Symbol.for('ReviewService'),
    ReviewController: Symbol.for('ReviewController'),
    // review
    PaystackService: Symbol.for('PaystackService'),
    

    // coupon
    AdminController: Symbol.for('AdminController'),
    AdminService: Symbol.for('AdminService'),
    PermissionRepository: Symbol.for('PermissionRepository'),
    PermissionService: Symbol.for('PermissionService'),
    PermissionController: Symbol.for('PermissionController'),

    // token
    TokenService: Symbol.for('TokenService'),

    // vendor
    VendorService: Symbol.for('VendorService'),
    VendorRepository: Symbol.for('VendorRepository'),
    VendorController: Symbol.for('VendorController'),
    VendorOrderController: Symbol.for('VendorOrderController'),
    VendorProfileController: Symbol.for('VendorProfileController'),
    VendorAnalyticsController: Symbol.for('VendorAnalyticsController'),
    VendorStripeService: Symbol.for('VendorStripeService'),

    PlanRepository: Symbol.for('PlanRepository'),
    PlanService: Symbol.for('PlanService'),
    PlanController: Symbol.for('PlanController'),

    NotificationRepository: Symbol.for('NotificationRepository'),
    NotificationController: Symbol.for('NotificationController'),
    NotificationService: Symbol.for('NotificationService'),
    NotificationPreferenceRepository: Symbol.for("NotificationPreferenceRepository"),
    PreferenceService: Symbol.for("PreferenceService"),
    ApplicationPreferenceRepository: Symbol.for("ApplicationPreferenceRepository"),

    FeaturedProductRepository: Symbol.for('FeaturedProductRepository'),
    FeaturedProductService: Symbol.for('FeaturedProductService'),
    FeaturedProductController: Symbol.for('FeaturedProductController'),
    FeeStructureService: Symbol.for('FeeStructureService'),
    FeeStructureRepository: Symbol.for('FeeStructureRepository'),

    //web hooks
    StripeWebhookController: Symbol.for('StripeWebhookController'),
    PaymentRepository: Symbol.for('PaymentRepository'),
    PaymentService: Symbol.for('PaymentService'),
    PaymentController: Symbol.for('PaymentController'),    
    TransactionOrderController: Symbol.for('TransactionOrderController'),    
    
    // buyers
    BuyerController: Symbol.for('BuyerController'),
    BuyerRepository: Symbol.for('BuyerRepository'),
    BuyerService: Symbol.for('BuyerService'),

    // disputes
    DisputeRepository: Symbol.for("DisputeRepository"),
    DisputeService: Symbol.for("DisputeService"),
    DisputeController: Symbol.for("DisputeController"),
    AdminDisputeController: Symbol.for("AdminDisputeController.ts"),

    AdminDashboardController: Symbol.for("AdminDashboardController"),
    AdminDashboardService: Symbol.for("AdminDashboardService"),
    AdminDashboardRepository: Symbol.for("AdminDashboardRepository"),

    //logs
    ActivityLogRepository: Symbol.for('ActivityLogRepository'),
    ActivityLogService: Symbol.for('ActivityLogService'),
    ActivityLogController: Symbol.for('ActivityLogController'),

    // cart
    CartController: Symbol.for("CartController"),
    CartService: Symbol.for("CartService"),
    CartRepository: Symbol.for("CartRepository"),
    
    // Property
    PropertyController: Symbol.for("PropertyController"),
    PropertyService: Symbol.for("PropertyService"),
    PropertyRepository: Symbol.for("PropertyRepository"),
    // for NIN services
    NINVerificationController: Symbol.for("NINVerificationController"),
    NINVerificationService: Symbol.for("NINVerificationService"),
    // address
    AddressRepository: Symbol.for("AddressRepository"),
    AddressService: Symbol.for("AddressService"),
    AddressController: Symbol.for("AddressController"),
    AddressModel: Symbol.for("AddressModel"),
    // carousel
    CarouselRepository: Symbol.for("CarouselRepository"),
    CarouselService: Symbol.for("CarouselService"),
    CarouselController: Symbol.for("CarouselController"),

    //wishlist binding
    WishlistRepository: Symbol.for('WishlistRepository'),
    WishlistService: Symbol.for('WishlistService'),
    WishlistController: Symbol.for('WishlistController'),


    WalletRepository: Symbol.for('WalletRepository'),
    StripeWalletRepository: Symbol.for('StripeWalletRepository'),
    WalletService: Symbol.for('WalletService'),
    StripeWalletService: Symbol.for('StripeWalletService'),
    WalletController: Symbol.for('WalletController'),
    StripeService: Symbol.for('StripeService'),


    TwoFactorRepository: Symbol.for('TwoFactorRepository'),
    TwoFactorService: Symbol.for('TwoFactorService'),
    TwoFactorController: Symbol.for('TwoFactorController'),
};