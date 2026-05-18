import { randomInt } from 'crypto';

export function generateTemporaryPassword(): string {
  const upperCaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCaseLetters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialCharacters = '@#$!%*?&';

  const allCharacters =
    upperCaseLetters + lowerCaseLetters + numbers + specialCharacters;

  const passwordLength = 12;

  const requiredCharacters = [
    upperCaseLetters[randomInt(upperCaseLetters.length)],
    lowerCaseLetters[randomInt(lowerCaseLetters.length)],
    numbers[randomInt(numbers.length)],
    specialCharacters[randomInt(specialCharacters.length)],
  ];

  const remainingCharacters = Array.from({
    length: passwordLength - requiredCharacters.length,
  }).map(() => allCharacters[randomInt(allCharacters.length)]);

  const passwordCharacters = [...requiredCharacters, ...remainingCharacters];

  for (let i = passwordCharacters.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [passwordCharacters[i], passwordCharacters[j]] = [
      passwordCharacters[j],
      passwordCharacters[i],
    ];
  }

  return passwordCharacters.join('');
}
