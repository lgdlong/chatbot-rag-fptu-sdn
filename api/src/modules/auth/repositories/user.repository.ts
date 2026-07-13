import { prisma } from '../services/db.service.js'
import { Prisma } from '@prisma/client'

export class UserRepository {
  static async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data })
  }

  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    })
  }

  static async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    })
  }

  /**
   * Promote or change a user's role (e.g. STUDENT -> LECTURER).
   * Single-column update; keeps the rest of the row untouched.
   */
  static async updateRole(id: string, role: string) {
    return prisma.user.update({
      where: { id },
      data: { role },
    })
  }

  /**
   * Soft-disable a user by flipping the `banned` flag. `banReason` is stored
   * alongside the flag (null when re-enabling) so future operators can see
   * why the account was disabled.
   */
  static async setBanned(
    id: string,
    banned: boolean,
    banReason: string | null
  ) {
    return prisma.user.update({
      where: { id },
      data: { banned, banReason },
    })
  }

  static async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    })
  }

  // ---------------------------------------------------------------------
  // Track F additions -- devLogin support for ChatService
  // ---------------------------------------------------------------------

  /**
   * Idempotent user upsert keyed by email. The pre-refactor chat devLogin
   * endpoint called this exact prisma pattern inline; Track F moves it here
   * so the service layer never imports prisma directly. Returns the
   * resulting User row (created or updated).
   */
  static async upsertByEmail(
    email: string,
    data: { id: string; name: string; role: string },
  ) {
    return prisma.user.upsert({
      where: { email },
      update: { role: data.role },
      create: {
        id: data.id,
        name: data.name,
        email,
        role: data.role,
      },
    })
  }

  /**
   * First account row attached to a user. The devLogin flow needs to know
   * whether a `credential` account already exists so it can create one or
   * refresh the password hash. Better Auth's `accountId` column is the
   * provider's user id (for credentials it's our own user.id), distinct
   * from the `account.id` primary key.
   */
  static async findFirstAccountByUserId(userId: string) {
    return prisma.account.findFirst({
      where: { userId },
    })
  }

  /**
   * Create a credential account row. Mirrors the fields the Better Auth
   * signUpEmail pathway writes (id / accountId / providerId / userId /
   * password). Caller is responsible for any pre-checks; the repo is a
   * thin pass-through.
   */
  static async createAccount(data: {
    id: string;
    accountId: string;
    providerId: string;
    userId: string;
    password: string;
  }) {
    return prisma.account.create({ data })
  }

  /**
   * Update an existing account row by primary key. Used by the devLogin
   * flow to refresh the password hash on every call so plaintext
   * credential changes are picked up without re-creating the user.
   */
  static async updateAccount(id: string, data: { password: string }) {
    return prisma.account.update({
      where: { id },
      data,
    })
  }
}
