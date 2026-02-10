import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../config/types';
import { CurrencyService } from '../services/CurrencyService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest } from '../types/customRequest';

@injectable()
export class CurrencyController {

    constructor(
        @inject(TYPES.CurrencyService)
        private readonly currencyService: CurrencyService
    ) { }

    create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { countryCode, country } = req.body;
        if (!countryCode) {
            return res.status(400).json(
                ApiError.badRequest('kindly supply the currency code')
            )
        }
        if (!country) {
            return res.status(400).json(
                ApiError.badRequest('kindly supply the country name')
            )
        }
        if (typeof countryCode !== 'string' || countryCode.trim().length !== 2) {
            return res.status(400).json(
                ApiError.badRequest('Country code must be exactly 2 characters (e.g., NG)')
            );
        }
        const currency = await this.currencyService.createCurrency({countryCode, country});
        return res.status(201).json(
            ApiResponse.created(
                currency
            )
        );
    })

    getAll = asyncHandler(async (_req: Request, res: Response) => {
        const currencies = await this.currencyService.getCurrencies();
        return res.status(200).json(
            ApiResponse.success(
                currencies
            )
        );
    })

    delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        await this.currencyService.deleteCurrency(req.params.id);
        return res.status(204).json(
            ApiResponse.success(
                {},
                "Currency Deleted"
            )
        );
    })
}