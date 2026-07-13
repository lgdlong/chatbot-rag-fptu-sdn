import { EmailWhitelistRepository } from "../repositories/email-whitelist.repository.js";

/**
 * ValidationError -- thrown by services to signal user-input problems.
 *
 * The `status` field tells the HTTP layer which status code to return.
 * 400 = malformed/invalid input, 404 = resource not found, 409 = conflict.
 */
export class ValidationError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string): string {
  const trimmed = (raw ?? "").toString().trim().toLowerCase();
  if (!trimmed) {
    throw new ValidationError("Email is required", 400);
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    throw new ValidationError("Invalid email format", 400);
  }
  return trimmed;
}

/**
 * EmailWhitelistService -- business logic for the student email whitelist.
 *
 * Layer rule: must NOT import prisma. All DB access goes through
 * EmailWhitelistRepository. All user-input validation throws ValidationError
 * with the correct HTTP status, which the controller maps to a JSON response.
 */
export class EmailWhitelistService {
  static async list(opts: { page: number; limit: number; q?: string }) {
    const { page, limit, q = "" } = opts;
    const skip = (page - 1) * limit;

    const where: any = q
      ? { email: { contains: q, mode: "insensitive" } }
      : {};

    const [emails, total] = await Promise.all([
      EmailWhitelistRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { addedAt: "desc" },
      }),
      EmailWhitelistRepository.count(where),
    ]);

    return {
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async add(rawEmail: string) {
    const email = normalizeEmail(rawEmail);

    const exists = await EmailWhitelistRepository.findByEmail(email);
    if (exists) {
      throw new ValidationError("Email already whitelisted", 409);
    }

    return EmailWhitelistRepository.create({ email });
  }

  static async importMany(emailsInput: unknown) {
    if (!Array.isArray(emailsInput)) {
      throw new ValidationError("emails must be an array of strings", 400);
    }

    const emails = (emailsInput as unknown[])
      .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
      .filter((e) => e && EMAIL_REGEX.test(e));

    if (emails.length === 0) {
      throw new ValidationError("No valid emails found in the list", 400);
    }

    // Dedupe against rows already in DB
    const existing = await EmailWhitelistRepository.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    const existingSet = new Set(
      (existing as Array<{ email: string }>).map((e) => e.email)
    );
    const toInsert = emails.filter((e) => !existingSet.has(e));

    if (toInsert.length > 0) {
      await EmailWhitelistRepository.createMany(
        toInsert.map((email) => ({ email }))
      );
    }

    return {
      importedCount: toInsert.length,
      skippedCount: emails.length - toInsert.length,
    };
  }

  static async remove(id: string) {
    const exists = await EmailWhitelistRepository.findById(id);
    if (!exists) {
      throw new ValidationError("Email not found in whitelist", 404);
    }
    await EmailWhitelistRepository.delete(id);
    return exists;
  }
}
