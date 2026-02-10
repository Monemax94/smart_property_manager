import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { CurrencyRepository } from '../repositories/CurrencyRepository';
import { ICurrencyCode } from '../models/CurrencyCode';
import { ApiError } from '../utils/ApiError';

@injectable()
export class CurrencyService  {

  constructor(
    @inject(TYPES.CurrencyRepository)
    private readonly currencyRepository: CurrencyRepository
  ) {}

  async createCurrency(data: Partial<ICurrencyCode>) {
    const existing = await this.currencyRepository.findByCode(data.countryCode);
    if (existing) {
      throw  ApiError.badRequest('Currency code already exists');
    }

    return this.currencyRepository.create(data);
  }

  async getCurrencies() {
    return this.currencyRepository.findAll();
  }

  async deleteCurrency(id: string): Promise<void> {
    await this.currencyRepository.deleteById(id);
  }
}
