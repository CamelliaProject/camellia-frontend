import { EMAIL_REGEX, PHONE_REGEX, PASSWORD_MIN_LENGTH, USERNAME_MAX_LENGTH } from '../constants';

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function validatePassword(password: string, minLength = PASSWORD_MIN_LENGTH): boolean {
  return password.length >= minLength;
}

export function validateUsername(username: string, maxLength = USERNAME_MAX_LENGTH): boolean {
  return username.trim().length > 0 && username.length <= maxLength;
}
