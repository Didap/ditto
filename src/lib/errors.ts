export enum ApiError {
  // Auth
  EMAIL_NAME_PASSWORD_REQUIRED = "Email, name and password are required",
  PASSWORD_TOO_SHORT = "Password must be at least 6 characters",
  EMAIL_ALREADY_REGISTERED = "This email is already registered",
  REGISTRATION_FAILED = "Registration failed",
  UNAUTHORIZED = "Unauthorized",

  // Designs
  DESIGN_NOT_FOUND = "Design not found",
  NAME_TOKENS_RESOLVED_REQUIRED = "Name, tokens and resolved are required",
  SAVE_FAILED = "Save failed",
  EXTRACTION_FAILED = "Extraction failed",
  IMPORT_FAILED = "Import failed",
  MAX_QUALITY_REACHED = "No improvement possible — the design is already at maximum quality.",
  UNKNOWN_ACTION = "Unknown action",

  // Inputs
  URL_REQUIRED = "URL is required",
  QUEST_ID_REQUIRED = "questId is required",
  PRICE_ID_REQUIRED = "priceId is required",
  INVALID_PRICE = "Invalid price",

  // Credits
  INSUFFICIENT_CREDITS = "Insufficient credits",

  // Stripe
  INVALID_SIGNATURE = "Invalid signature",
  NO_BILLING_ACCOUNT = "No billing account found. Subscribe to a plan first.",

  // Figma
  FIGMA_MISSING_PARAMS = "Missing token, fileKey, or resolved design",
}

/** Format an insufficient credits message with amounts */
export function insufficientCredits(required: number, available: number): string {
  return `${ApiError.INSUFFICIENT_CREDITS}. ${required} credits required, you have ${available}.`;
}
