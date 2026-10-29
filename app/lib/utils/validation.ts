// app/lib/utils/validation.ts

export function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id)
}
