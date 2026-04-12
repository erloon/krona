import type { PinSetupResult } from '@/features/auth/shared/types/security';

type RuntimeSupport = {
  supported: boolean;
  message: string | null;
};

const unsupportedMessage =
  'PIN i szyfrowanie bazy danych dzialaja tylko w natywnym buildzie Android/iOS.';

export const localSecurityService = {
  getRuntimeSupport(): RuntimeSupport {
    return {
      supported: false,
      message: unsupportedMessage,
    };
  },
  async hasPin(_userId: string) {
    return false;
  },
  async setupPin(_userId: string, _pin: string): Promise<PinSetupResult> {
    throw new Error(unsupportedMessage);
  },
  async unlockWithPin(_userId: string, _pin: string): Promise<PinSetupResult> {
    throw new Error(unsupportedMessage);
  },
  async changePin(_userId: string, _currentPin: string, _nextPin: string) {
    throw new Error(unsupportedMessage);
  },
  async resetSecureLocalData() {
    return;
  },
  async clearPinMetadata() {
    return;
  },
};
