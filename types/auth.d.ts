// Расширяем тип пользователя Better Auth — добавляем role
// export {} делает файл модулем и избегает конфликтов типов
declare module "better-auth" {
  interface User {
    role: "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "INTERN";
  }
}

export {};