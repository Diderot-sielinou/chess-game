import { ErrorCode } from './error-codes.enum';
import { ErrorMessages } from './error-messages';

export function validateErrorMessages(): void {
  const allCodes = Object.values(ErrorCode);

  const missingMessages = allCodes.filter((code) => !(code in ErrorMessages));

  if (missingMessages.length > 0) {
    throw new Error(
      `🚨 Missing error messages for the following codes: ${missingMessages.join(', ')}`,
    );
  }

  console.log(`✅ All ${allCodes.length} ErrorCodes have corresponding messages.`);
}
