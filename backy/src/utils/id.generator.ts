import { Model } from 'mongoose';
import { nanoid } from 'nanoid';

export async function generateSequentialId(
    model: Model<any>,
    prefix: string,
    digits: number = 6
): Promise<string> {
    const count = await model.countDocuments();
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    // return `${prefix}-${dateStr}-${(count + 1).toString().padStart(digits, '0')}`;
    return `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nanoid(6)}`;
}