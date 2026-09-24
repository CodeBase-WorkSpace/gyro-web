import { SIGNUP_ONBOARDING_PATH } from "../onboarding";
import type { AuthResponse } from "./types";

type RegistrationVerificationInput = {
  email?: string;
  phoneNumber?: string;
  code: string;
};

type RegistrationVerificationDependencies = {
  verify: (input: RegistrationVerificationInput) => Promise<AuthResponse>;
  persistSession: (auth: AuthResponse) => Promise<void>;
};

export async function completeRegistrationVerification(
  input: RegistrationVerificationInput,
  dependencies: RegistrationVerificationDependencies,
) {
  const auth = await dependencies.verify(input);
  await dependencies.persistSession(auth);
  return SIGNUP_ONBOARDING_PATH;
}
