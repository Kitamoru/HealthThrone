 * Утилита для проверки обязательных полей объекта
 */
export type RequiredFields<T extends object, K extends keyof T> = Pick<T, K>;

/**
 * Метод для проверки обязательного присутствия определенных ключей в объекте
 */
export const validateRequiredFields = <T extends object, K extends keyof T>(
  obj: T,
  requiredKeys: K[],
  errorMessage?: string
): boolean => {
  for (let key of requiredKeys) {
    if (!(key in obj) || typeof obj[key] === 'undefined') {
      throw new Error(errorMessage ?? `Отсутствует обязательное свойство "${String(key)}"`);
    }
  }
  return true;
};
