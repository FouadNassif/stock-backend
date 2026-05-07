export function generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isAdult(dateOfBirth: Date): boolean {
    const today = new Date();
    const eighteenthBirthday = new Date(dateOfBirth);

    eighteenthBirthday.setFullYear(eighteenthBirthday.getFullYear() + 18);

    return eighteenthBirthday <= today;
}

export function generateReferralCode(fullName: string): string {
    const namePart = fullName
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 4)
        .toUpperCase()
        .padEnd(4, 'X');

    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();

    return `${namePart}${randomPart}`;
}