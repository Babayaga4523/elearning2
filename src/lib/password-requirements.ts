/**
 * Password Requirements for Password Reset
 *
 * Based on NIST Special Publication 800-63B guidelines:
 * - Minimum 8 characters
 * - No mandatory special character requirement (reduces UX friction)
 * - Maximum 128 characters (prevent DoS via memory exhaustion)
 * - User-chosen secrets should NOT require mixed character sets by default
 *   (users tend to choose weaker passwords when forced)
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,

  // Character requirements (relaxed from traditional requirements)
  // These are checked individually for better UX feedback
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false, // NIST recommends against this - causes weak passwords

  // Error messages
  errors: {
    tooShort: "Password minimal harus 8 karakter",
    tooLong: "Password maksimal 128 karakter",
    missingUppercase: "Password harus mengandung huruf besar",
    missingLowercase: "Password harus mengandung huruf kecil",
    missingNumber: "Password harus mengandung angka",
    missingSpecialChar: "Password tidak boleh mengandung spasi",
    passwordMismatch: "Password dan konfirmasi password tidak cocok",
  },
} as const;

/**
 * Individual requirement check result
 */
export interface PasswordRequirement {
  met: boolean;
  message: string;
}

/**
 * All requirement check results
 */
export interface PasswordValidationResult {
  isValid: boolean;
  requirements: {
    length: PasswordRequirement;
    uppercase: PasswordRequirement;
    lowercase: PasswordRequirement;
    number: PasswordRequirement;
    specialChar: PasswordRequirement;
  };
  errors: string[];
}

/**
 * Check if password meets all requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const requirements = {
    length: {
      met: password.length >= PASSWORD_REQUIREMENTS.minLength,
      message:
        password.length >= PASSWORD_REQUIREMENTS.minLength
          ? "Minimal 8 karakter"
          : PASSWORD_REQUIREMENTS.errors.tooShort,
    },
    uppercase: {
      met: !PASSWORD_REQUIREMENTS.requireUppercase || /[A-Z]/.test(password),
      message:
        PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)
          ? PASSWORD_REQUIREMENTS.errors.missingUppercase
          : "Mengandung huruf besar",
    },
    lowercase: {
      met: !PASSWORD_REQUIREMENTS.requireLowercase || /[a-z]/.test(password),
      message:
        PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)
          ? PASSWORD_REQUIREMENTS.errors.missingLowercase
          : "Mengandung huruf kecil",
    },
    number: {
      met: !PASSWORD_REQUIREMENTS.requireNumber || /[0-9]/.test(password),
      message:
        PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)
          ? PASSWORD_REQUIREMENTS.errors.missingNumber
          : "Mengandung angka",
    },
    specialChar: {
      met: !PASSWORD_REQUIREMENTS.requireSpecialChar || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      message:
        PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
          ? PASSWORD_REQUIREMENTS.errors.missingSpecialChar
          : "Mengandung karakter khusus",
    },
  };

  const errors = Object.values(requirements)
    .filter((req) => !req.met)
    .map((req) => req.message);

  return {
    isValid: errors.length === 0,
    requirements,
    errors,
  };
}

/**
 * Check if password and confirmation match
 */
export function passwordsMatch(
  password: string,
  confirmPassword: string
): boolean {
  return password === confirmPassword;
}

/**
 * Validate password reset form
 */
export function validatePasswordResetForm(
  password: string,
  confirmPassword: string
): {
  isValid: boolean;
  errors: string[];
} {
  const validation = validatePassword(password);

  const errors = [...validation.errors];

  // Check password match
  if (!passwordsMatch(password, confirmPassword)) {
    errors.push(PASSWORD_REQUIREMENTS.errors.passwordMismatch);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}