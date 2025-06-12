/**
 * Утилита для проверки обязательных полей объекта
 */
export type RequiredFields<T extends object, K extends keyof T> = Pick<T, K>;
export const validateRequiredFields = <T extends object, K extends keyof T>(
  obj: T,
  requiredKeys: K[],
  errorMessage?: string
): string | null => {
  for (let key of requiredKeys) {
    if (obj[key] == null) {
      return errorMessage ?? `Отсутствует обязательное свойство "${String(key)}"`;
    }
  }
  return null;
};
