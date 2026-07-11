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
}
