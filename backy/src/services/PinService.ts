import bcrypt from 'bcrypt';

export class PinService {
  private static SALT_ROUNDS = 10;

  static async hashPin(pin: string) {
    return bcrypt.hash(pin, this.SALT_ROUNDS);
  }

  static async comparePin(pin: string, hash: string) {
    return bcrypt.compare(pin, hash);
  }
}