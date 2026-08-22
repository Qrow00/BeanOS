import { getDatabase } from '../database/connection';

type LocalAuthModule = typeof import('expo-local-authentication');

function localAuth(): LocalAuthModule | null {
  try {
    return require('expo-local-authentication');
  } catch {
    return null;
  }
}

const ENABLED_KEY = 'biometric_login_enabled';
const userKey = (userId: number) => `biometric_user_${userId}`;

export async function getAuthMethodLabel(): Promise<string> {
  try {
    const LA = localAuth();
    if (!LA) return 'Biometrics';
    const types = await LA.supportedAuthenticationTypesAsync();
    if (types.includes(LA.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
    if (types.includes(LA.AuthenticationType.IRIS)) return 'Iris';
    if (types.includes(LA.AuthenticationType.FINGERPRINT)) return 'Fingerprint';
  } catch {}
  return 'Biometrics';
}

export async function isDeviceCapable(): Promise<boolean> {
  try {
    const LA = localAuth();
    if (!LA) return false;
    const hasHardware = await LA.hasHardwareAsync();
    const enrolled = await LA.isEnrolledAsync();
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function promptBiometric(promptMessage: string): Promise<boolean> {
  try {
    const LA = localAuth();
    if (!LA) return false;
    const result = await LA.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}

async function readFlag(key: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      key
    );
    return row?.value === '1';
  } catch {
    return false;
  }
}

async function writeFlag(key: string, enabled: boolean): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      key,
      enabled ? '1' : '0'
    );
  } catch {}
}

export async function isEnabledGlobally(): Promise<boolean> {
  return readFlag(ENABLED_KEY);
}

export async function setEnabledGlobally(enabled: boolean): Promise<void> {
  await writeFlag(ENABLED_KEY, enabled);
}

export async function isEnrolledForUser(userId: number): Promise<boolean> {
  return readFlag(userKey(userId));
}

export async function setEnrolledForUser(userId: number, enrolled: boolean): Promise<void> {
  await writeFlag(userKey(userId), enrolled);
}

export async function canUserUseBiometric(userId: number): Promise<boolean> {
  if (!(await isDeviceCapable())) return false;
  if (!(await isEnabledGlobally())) return false;
  return isEnrolledForUser(userId);
}
