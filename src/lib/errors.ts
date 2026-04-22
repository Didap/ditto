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

  // Catalog
  CATALOG_ITEM_NOT_FOUND = "Catalog item not found",
  CATALOG_ALREADY_UNLOCKED = "Design already unlocked",

  // Recycle
  DESIGN_NOT_IN_TRASH = "Design is not in trash",
  DESIGN_NOT_RECYCLABLE = "This design was obtained via recycling and cannot be recycled again",
  NO_CATALOG_AVAILABLE = "No catalog designs available for recycling",
  INVALID_RECYCLE_ACTION = "Invalid action. Must be 'catalog' or 'credits'",

  // Unlocks
  INVALID_FEATURE = "Invalid feature",
  FEATURE_ALREADY_UNLOCKED = "Feature already unlocked",

  // Figma
  FIGMA_MISSING_PARAMS = "Missing token, fileKey, or resolved design",

  // Bookmarklet fallback
  INVALID_TOKEN = "Invalid or expired bookmarklet token",
  INVALID_EXTRACTION_DATA = "Invalid extraction payload",

  // Profile
  NAME_TOO_SHORT = "Name must be at least 2 characters",
  NAME_TOO_LONG = "Name must be at most 60 characters",
  AVATAR_MISSING = "No avatar file provided",
  AVATAR_INVALID_TYPE = "Avatar must be a JPEG, PNG, or WebP image",
  AVATAR_TOO_LARGE = "Avatar must be at most 5 MB",
  CLOUDINARY_NOT_CONFIGURED = "Image uploads are not configured on this server",
  UPLOAD_FAILED = "Upload failed",

  // Admin
  FORBIDDEN = "Forbidden",
  USER_NOT_FOUND = "User not found",
  EMAIL_IN_USE = "This email is already registered to another user",
  INVALID_EMAIL = "Invalid email address",
  INVALID_CREDITS = "Credits must be a non-negative integer",
  CANNOT_DELETE_SELF = "You cannot delete your own admin account",
}

/** Format an insufficient credits message with amounts */
export function insufficientCredits(required: number, available: number): string {
  return `${ApiError.INSUFFICIENT_CREDITS}. ${required} credits required, you have ${available}.`;
}
