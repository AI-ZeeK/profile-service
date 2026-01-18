export class Helpers {
  static generateOTP({
    length = 5,
    options = {
      numbers: true,
      uppercase: false,
      lowercase: false,
    },
  }: {
    length: number;
    options: { numbers: boolean; uppercase?: boolean; lowercase?: boolean };
  }): string {
    const { numbers, uppercase, lowercase } = options;

    let characters = '';
    if (numbers) characters += '0123456789';
    if (uppercase) characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lowercase) characters += 'abcdefghijklmnopqrstuvwxyz';

    if (!characters) {
      throw new Error('At least one character type must be enabled.');
    }

    let otp = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      otp += characters[randomIndex];
    }

    return otp;
  }

  static getFutureTimestamp({ seconds }: { seconds: number }): Date {
    const now = new Date();
    return new Date(now.getTime() + seconds * 1000);
  }

  static generateUniqueValue(value: string): string {
    const prefix = value.slice(0, 3).toUpperCase();

    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%&';
    let randomSuffix = '';
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomSuffix += characters[randomIndex];
    }

    return `${prefix}-${randomSuffix}`;
  }

  static generateUserSlug(): string {
    // Generate 3 random uppercase letters
    const letters = Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    ).join('');

    // Generate 4 random digits
    const digits = Math.floor(1000 + Math.random() * 9000).toString();

    // Get current date and encode as 4 uppercase letters (e.g., Dec 16, 2025 -> D16Z)
    // We'll use: 1st letter of month, 2-digit day, last char of year (base36)
    const now = new Date();
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const monthLetter = months[now.getMonth()];
    const day = now.getDate().toString().padStart(2, '0');
    const yearChar = now.getFullYear().toString(36).toUpperCase().slice(-1); // base36 for variety
    const datestamp = `${monthLetter}${day}${yearChar}`;

    return `${letters}-${digits}-${datestamp}`;
  }

  static computeTrend(
    current: number,
    previous: number,
  ): {
    percentage: number;
    trend: 'increase' | 'decrease' | 'neutral';
  } {
    if (previous === 0 && current > 0)
      return { percentage: 100, trend: 'neutral' };
    if (previous === 0 && current === 0)
      return { percentage: 0, trend: 'neutral' };
    const diff = current - previous;
    const pct = previous !== 0 ? (diff / previous) * 100 : 0;
    let trend: 'increase' | 'decrease' | 'neutral' = 'neutral';
    if (pct > 0) trend = 'increase';
    else if (pct < 0) trend = 'decrease';
    else if (pct === 0) trend = 'neutral';
    return { percentage: Math.round(pct * 10) / 10, trend };
  }
}
