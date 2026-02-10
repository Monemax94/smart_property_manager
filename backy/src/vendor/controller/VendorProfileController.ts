import { Response } from 'express';
import { AuthenticatedRequest } from '../../types/customRequest';
import { injectable, inject } from 'inversify';
import { VendorService } from '../../services/VendorService';
import { TYPES } from '../../config/types';
import { Types } from 'mongoose';

import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { ApiResponse } from '../../utils/ApiResponse';
import { VendorStripeService } from '../../services/VendorStripeService';
import { PayoutStatus, VendorPayoutModel } from '../../models/Payouts';
import VendorModel from '../../models/Vendor';
import { UserService } from '../../services/UserService';
import { VendorRepository } from '../../repositories/VendorRepository';
import { PayoutBankService } from '../../services/PayoutBankService';
import { IProfileDocument } from '../../models/Profile';
import { ReviewService } from '../../services/ReviewService';

@injectable()
export class VendorProfileController {
  constructor(
    @inject(TYPES.VendorService) private vendorService: VendorService,
    @inject(TYPES.ReviewService) private reviewServices: ReviewService,
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.VendorStripeService) private payoutService: VendorStripeService,
    @inject(TYPES.PayoutBankService) private payoutBankService: PayoutBankService,
    @inject(TYPES.VendorRepository) private payoutServiceRepo: VendorRepository
  ) { }

  /**
  * Create a payout to vendor
  * POST /api/payouts/create
  */
  createPayout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { amount, currency, orderIds, transactionIds } = req.body;
    const vendorId = req.user.vendor._id;
    // Validation
    if (!vendorId || !amount || amount <= 0) {
      return res.status(400).json(
        ApiError.badRequest('Valid vendor ID and amount are required'));
    }

    const result = await this.payoutService.createPayout(
      new Types.ObjectId(vendorId),
      amount,
      currency || 'usd',
      orderIds?.map((id: string) => new Types.ObjectId(id)) || [],
      transactionIds || []
    );

    return res.status(201).json(
      ApiResponse.success(
        {
          payout: result.payoutRecord,
          stripePayoutId: result.stripePayout.id,
          arrivalDate: result.stripePayout.arrival_date,
        },
        'Payout created successfully'
      ))
  })
  /**
  * Create a payout to vendor
  * POST /api/payouts/create
  */
  transferToVendorStripe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { amount, currency, metadata } = req.body;
    const vendorId = req.user.vendor._id;
    // Validation
    if (!vendorId || !amount || amount <= 0) {
      return res.status(400).json(
        ApiError.badRequest('Valid vendor ID and amount are required'));
    }

    const result = await this.payoutService.transferToVendor(
      vendorId,
      amount,
      currency,
      metadata
    )

    return res.status(201).json(
      ApiResponse.success(
        result,
        'Amount Transfer'
      ))
  })

  getVendorReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorId = req.user.vendor._id;
    const reviews = await this.reviewServices.getVendorReviews(vendorId.toString());
    res.json(new ApiResponse(200, reviews, 'Vendor reviews retrieved successfully'));
  });
  updateProfile = (async (req: AuthenticatedRequest, res: Response) => {
    const {
      storeName,
      storeDescription,
      taxId,
      website,
      categories,
      address,
      countryCode,
      uploadedFiles
    } = req.body;
    const vendorId = req.user.vendor._id;

    const getFilesByDocumentName = (name: string) =>
      uploadedFiles?.filter((f: any) => f.documentName?.includes(name)) || [];

    const vendor = await this.vendorService.updateVendor(
      vendorId.toString(),
      {
        storeName,
        storeDescription,
        taxId,
        website,
        categories,
        address,
        countryCode,
        logo: getFilesByDocumentName('storeLogo'),
        businessRegistrationFiles: getFilesByDocumentName('businessRegistration'),
        vendorNINFiles: getFilesByDocumentName('vendorNIN')
      }
    );
    return res.status(201).json(new ApiResponse(200, vendor, 'Profile Updated successfully'));
  });


  /**
   * Get or create vendor Stripe Connect account
   */
  setupStripeAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorId = req.user.vendor._id;


    if (!vendorId) throw ApiError.unauthorized('User not authenticated');

    // Check if already has account
    const vendor = await VendorModel.findById(vendorId);
    if (vendor?.stripeConnectAccountId) {
      // const loginLink = await this.payoutService.getAccountLoginLink(vendor.stripeConnectAccountId);
      return res.status(200).json(
        ApiResponse.success(
          {
            stripeAccountId: vendor.stripeConnectAccountId,
            // loginLink
          },
          'Account already connected'
        )
      )
    }

    // get current user
    const user = await this.userService.findById(req.user._id)
    // Ensure profile is populated
    if (!user.profile || typeof user.profile === 'string') {
      return res.status(400).json(
        ApiError.badRequest(
          'Kindly register your business profile'
        )
      )
    }
    const profile = user.profile as IProfileDocument;

    // Optional DOB extraction
    let dob: { day: number; month: number; year: number } | undefined;
    if (profile.dob) {
      dob = {
        day: profile.dob.getUTCDate(),
        month: profile.dob.getUTCMonth() + 1,
        year: profile.dob.getUTCFullYear()
      };
    }
    // Create new account
    const stripeAccountId = await this.payoutService.getOrCreateConnectAccount(vendorId, {
      country: 'NG',
      firstName: profile.firstName,
      lastName: profile.lastName,
      address: profile?.address,
      email: user.email || profile.alternateEmail || '',
      phone: user.phoneNumber,
      dob,
      businessName: vendor?.storeName,
      businessUrl: vendor?.website || 'https://qartt.com',
      name: vendor?.storeName,
      city: vendor?.address.city,
      postalCode: vendor?.address.postalCode,
      state: vendor?.address.state,
      countryAddress: vendor?.address.country,
      ip: req.ip
    });

    // const loginLink = await this.payoutService.getAccountLoginLink(stripeAccountId);

    return res.status(201).json({
      success: true,
      message: 'Stripe Connect account created',
      stripeAccountId,
      // loginLink
    });
  });

  /**
   * Get vendor payout balance
   */
  getPayoutBalance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorId = req.user._id;

    const balance = await this.payoutServiceRepo.getUnpaidBalance(vendorId);
    const pendingPayouts = await this.payoutServiceRepo.getPendingPayouts(vendorId);

    return res.status(200).json(
      ApiResponse.success(
        {
          unpaidBalance: balance,
          pendingPayouts: pendingPayouts.length,
          minPayoutAmount: 100
        }
      )
    );
  });

  /**
   * Request payout
   */
  requestPayout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorId = req.user._id;

    const payout = await this.payoutService.preparePayout(vendorId);
    if (!payout) {
      return res.status(400).json( 
        ApiError.badRequest('Insufficient balance or no pending transactions for payout')
      )
    }

    // Execute immediately
    const executed = await this.payoutService.executePayout(payout._id as Types.ObjectId);

    return res.status(200).json({
      success: true,
      message: 'Payout initiated successfully',
      data: executed
    });
  });

  /**
   * Get payout history
   */
  getPayoutHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorId = req.user.vendor._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;
    const [payouts, total] = await Promise.all([
      this.payoutServiceRepo.getPayoutHistory(vendorId, limit, skip),
      VendorPayoutModel.countDocuments({ vendorId })
    ])

    return res.status(200).json(

      ApiResponse.success(
        {
          data: payouts,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        }
      ));
  });

  /**
   * Get payout details
   */
  getPayoutDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { payoutId } = req.params;
    const vendorId = req.user.vendor._id;

    const payout = await VendorPayoutModel.findById(payoutId)
      .populate('vendorId')
      .populate('orders')
      .lean();

    if (!payout) res.status(404).json(ApiError.notFound('Payout not found'));
    if (payout.vendorId.toString() !== vendorId.toString()) {
      res.status(403).json(ApiError.forbidden('You do not have access to this payout'));
    }

    // Sync status with Stripe
    const updated = await this.payoutService.syncPayoutStatus(new Types.ObjectId(payoutId));

    return res.status(200).json(
      ApiResponse.success({
        updated
      })
    );
  });

  createOrUpdateBank = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { pin, ...data } = req.body
    const vendorId = req.user.vendor._id;
    const userId = req.user?._id;
    if (!vendorId) throw ApiError.unauthorized('User not authenticated');

    // Check if already has account
    const vendor = await VendorModel.findById(vendorId).populate({
      path: 'countryCode',
      model: 'CurrencyCode',
    })
    if (!vendor?.stripeConnectAccountId) {
      // get current user
      const user = await this.userService.findById(req.user._id)
      // Ensure profile is populated
      if (!user.profile || typeof user.profile === 'string') {
        return res.status(400).json(
          ApiError.badRequest(
            'Kindly register your business profile'
          )
        )
      }
      const profile = user.profile as IProfileDocument;

      // Optional DOB extraction
      let dob: { day: number; month: number; year: number } | undefined;
      if (profile.dob) {
        dob = {
          day: profile.dob.getUTCDate(),
          month: profile.dob.getUTCMonth() + 1,
          year: profile.dob.getUTCFullYear()
        };
      }
      // Create new account
      await this.payoutService.getOrCreateConnectAccount(vendorId, {
        country: vendor.countryCode || 'NG',
        firstName: profile.firstName,
        lastName: profile.lastName,
        address: profile?.address,
        email: user.email || profile.alternateEmail || '',
        phone: user.phoneNumber,
        dob,
        businessName: vendor?.storeName,
        businessUrl: vendor?.website || 'https://qartt.com',
        name: vendor?.storeName,
        city: vendor?.address.city,
        postalCode: vendor?.address.postalCode,
        state: vendor?.address.state,
        countryAddress: vendor?.address.country,
        ip: req.ip
      });
    }

    const bank = await this.payoutBankService.createOrUpdate(vendorId, data, userId, pin);
    return res.status(200).json(
      ApiResponse.success(bank, "Bank payout saved successfully")
    );
  });

  getMyBank = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorId = new Types.ObjectId(req.user.vendor._id);
    const bank = await this.payoutBankService.getByVendor(vendorId);
    return res.status(200).json(ApiResponse.success(bank));
  });

  deleteBank = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await this.payoutBankService.delete(id);
    return res.status(200).json(
      ApiResponse.success(null, "Payout account deleted")
    );
  });

  /**
  * Get vendor balance
  */
  getBalance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const vendorId = new Types.ObjectId(req.user.vendor._id);

    const balance = await this.payoutService.getVendorBalance(
      vendorId
    );

    return res.status(200).json(
      ApiResponse.success(
        balance
      )
    );

  });

  /**
  * Get payout statistics for vendor
  * GET /api/payouts/stats/:vendorId
  */
  getPayoutStats = async (req: AuthenticatedRequest, res: Response) => {

    const vendorId = new Types.ObjectId(req.user.vendor._id);
    const { startDate, endDate } = req.query;

    const matchQuery: any = { vendorId };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate as string);
    }

    const stats = await VendorPayoutModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const totalPaid = await VendorPayoutModel.aggregate([
      {
        $match: {
          vendorId: new Types.ObjectId(vendorId),
          status: PayoutStatus.PAID,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json(
      ApiResponse.success(
        {
          byStatus: stats,
          totalPaid: totalPaid[0] || { total: 0, count: 0 },
        }
      ))
  };

}