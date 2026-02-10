import { injectable } from 'inversify';
import { CurrencySchemaModel, ICurrencyCode } from '../models/CurrencyCode';

@injectable()
export class CurrencyRepository {

  async create(data: Partial<ICurrencyCode>): Promise<ICurrencyCode> {
    return CurrencySchemaModel.create({ ...data });
  }

  async findAll(): Promise<ICurrencyCode[]> {
    return CurrencySchemaModel.find().sort({ countryCode: 1 });
  }

  async findByCode(countryCode: string): Promise<ICurrencyCode | null> {
    return CurrencySchemaModel.findOne({ countryCode });
  }

  async deleteById(id: string): Promise<void> {
    await CurrencySchemaModel.findByIdAndDelete(id);
  }
}
