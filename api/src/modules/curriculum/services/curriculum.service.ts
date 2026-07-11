import { MajorRepository } from "../repositories/major.repository.js";
import { SpecializationRepository } from "../repositories/specialization.repository.js";
import { CurriculumRepository } from "../repositories/curriculum.repository.js";
import { CurriculumSubjectRepository } from "../repositories/curriculum-subject.repository.js";
import { CourseRepository } from "../../courses/repositories/course.repository.js";

/**
 * Error class that carries an HTTP status code so the controller layer can
 * map a thrown service error to the correct response status without leaking
 * validation logic into the HTTP boundary.
 */
export class CurriculumServiceError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "CurriculumServiceError";
    this.statusCode = statusCode;
  }
}

/**
 * CurriculumService -- all business logic for the curriculum module.
 *
 * Pure orchestration over the four repositories below. Never imports prisma
 * directly. Throws `CurriculumServiceError` for client-facing errors (400,
 * 404, 409) with messages that match the pre-refactor controller verbatim
 * so the HTTP response body shape stays identical.
 */
export class CurriculumService {
  // ==========================================
  // MAJOR
  // ==========================================

  static async listMajors() {
    return MajorRepository.findMany();
  }

  static async createMajor(
    rawCode: string,
    rawName: string,
    rawDescription: string = "",
  ) {
    const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const description = typeof rawDescription === "string" ? rawDescription.trim() : "";

    if (!code || !name) {
      throw new CurriculumServiceError(400, "Major code and name are required");
    }

    const exists = await MajorRepository.findByCode(code);
    if (exists) {
      throw new CurriculumServiceError(409, "Major code already exists");
    }

    return MajorRepository.create({ code, name, description });
  }

  static async updateMajor(
    id: string,
    rawName: string,
    rawDescription: string = "",
  ) {
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const description = typeof rawDescription === "string" ? rawDescription.trim() : "";

    if (!name) {
      throw new CurriculumServiceError(400, "Major name is required");
    }

    return MajorRepository.update(id, { name, description });
  }

  static async deleteMajor(id: string) {
    const hasSpecs = await SpecializationRepository.findFirstByMajor(id);
    if (hasSpecs) {
      throw new CurriculumServiceError(
        409,
        "Cannot delete Major. Please delete all associated Specializations first.",
      );
    }

    return MajorRepository.delete(id);
  }

  // ==========================================
  // SPECIALIZATION
  // ==========================================

  static async listSpecializations() {
    return SpecializationRepository.findMany();
  }

  static async createSpecialization(
    majorId: string,
    rawCode: string,
    rawName: string,
    rawDescription: string = "",
  ) {
    const normalizedMajorId = typeof majorId === "string" ? majorId : "";
    const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const description = typeof rawDescription === "string" ? rawDescription.trim() : "";

    if (!normalizedMajorId || !code || !name) {
      throw new CurriculumServiceError(
        400,
        "Major ID, code, and name are required",
      );
    }

    const majorExists = await MajorRepository.findById(normalizedMajorId);
    if (!majorExists) {
      throw new CurriculumServiceError(404, "Major not found");
    }

    const exists = await SpecializationRepository.findByCode(code);
    if (exists) {
      throw new CurriculumServiceError(409, "Specialization code already exists");
    }

    return SpecializationRepository.create({
      majorId: normalizedMajorId,
      code,
      name,
      description,
    });
  }

  static async updateSpecialization(
    id: string,
    rawName: string,
    rawDescription: string = "",
  ) {
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const description = typeof rawDescription === "string" ? rawDescription.trim() : "";

    if (!name) {
      throw new CurriculumServiceError(400, "Specialization name is required");
    }

    return SpecializationRepository.update(id, { name, description });
  }

  static async deleteSpecialization(id: string) {
    const hasCurriculums = await CurriculumRepository.findFirstBySpecialization(id);
    if (hasCurriculums) {
      throw new CurriculumServiceError(
        409,
        "Cannot delete Specialization. There are curriculums linked to this specialization.",
      );
    }

    return SpecializationRepository.delete(id);
  }

  // ==========================================
  // CURRICULUM
  // ==========================================

  static async listCurriculums() {
    return CurriculumRepository.findMany();
  }

  static async getCurriculumDetail(identifier: string) {
    const curr = await CurriculumRepository.findFirstByCurriculumIdOrIdWithDetails(
      identifier,
    );
    if (!curr) {
      throw new CurriculumServiceError(404, "Curriculum not found");
    }
    return curr;
  }

  static async createCurriculum(
    rawCurriculumId: string,
    majorId: string,
    specializationId: string | null,
    rawBatchCode: string,
  ) {
    const curriculumId =
      typeof rawCurriculumId === "string"
        ? rawCurriculumId.trim().toUpperCase()
        : "";
    const normalizedMajorId = typeof majorId === "string" ? majorId : "";
    const normalizedSpecializationId =
      typeof specializationId === "string" ? specializationId : null;
    const batchCode = typeof rawBatchCode === "string" ? rawBatchCode.trim() : "";

    if (!curriculumId || !normalizedMajorId || !batchCode) {
      throw new CurriculumServiceError(
        400,
        "Curriculum ID (BIT_SE_NJS_19B), Major ID, and Batch Code are required",
      );
    }

    const majorExists = await MajorRepository.findById(normalizedMajorId);
    if (!majorExists) {
      throw new CurriculumServiceError(404, "Major not found");
    }

    if (normalizedSpecializationId) {
      const specExists = await SpecializationRepository.findById(
        normalizedSpecializationId,
      );
      if (!specExists) {
        throw new CurriculumServiceError(404, "Specialization not found");
      }
    }

    const exists = await CurriculumRepository.findByCurriculumId(curriculumId);
    if (exists) {
      throw new CurriculumServiceError(409, "Curriculum ID already exists");
    }

    return CurriculumRepository.create({
      curriculumId,
      majorId: normalizedMajorId,
      specializationId: normalizedSpecializationId,
      batchCode,
    });
  }

  static async updateCurriculum(
    id: string,
    majorId: string,
    specializationId: string | null,
    rawBatchCode: string,
  ) {
    const normalizedMajorId = typeof majorId === "string" ? majorId : "";
    const normalizedSpecializationId =
      typeof specializationId === "string" ? specializationId : null;
    const batchCode = typeof rawBatchCode === "string" ? rawBatchCode.trim() : "";

    if (!normalizedMajorId || !batchCode) {
      throw new CurriculumServiceError(
        400,
        "Major ID and Batch Code are required",
      );
    }

    const majorExists = await MajorRepository.findById(normalizedMajorId);
    if (!majorExists) {
      throw new CurriculumServiceError(404, "Major not found");
    }

    if (normalizedSpecializationId) {
      const specExists = await SpecializationRepository.findById(
        normalizedSpecializationId,
      );
      if (!specExists) {
        throw new CurriculumServiceError(404, "Specialization not found");
      }
    }

    return CurriculumRepository.update(id, {
      majorId: normalizedMajorId,
      specializationId: normalizedSpecializationId,
      batchCode,
    });
  }

  static async deleteCurriculum(id: string) {
    return CurriculumRepository.delete(id);
  }

  // ==========================================
  // CURRICULUM <-> SUBJECT (Course)
  // ==========================================

  static async assignSubject(
    curriculumId: string,
    courseId: string,
    semesterNo: number,
    isSpecializationSpecific: boolean,
  ) {
    const normalizedCourseId = typeof courseId === "string" ? courseId : "";
    const normalizedSemesterNo =
      typeof semesterNo === "number" ? semesterNo : 1;
    const normalizedFlag =
      typeof isSpecializationSpecific === "boolean"
        ? isSpecializationSpecific
        : false;

    if (
      !normalizedCourseId ||
      normalizedSemesterNo < 1 ||
      normalizedSemesterNo > 9
    ) {
      throw new CurriculumServiceError(
        400,
        "Course ID and a valid Semester No (1-9) are required",
      );
    }

    const curr = await CurriculumRepository.findFirstByCurriculumIdOrId(
      curriculumId,
    );
    if (!curr) {
      throw new CurriculumServiceError(404, "Curriculum not found");
    }

    const course = await CourseRepository.findById(normalizedCourseId);
    if (!course) {
      throw new CurriculumServiceError(404, "Subject/Course not found");
    }

    try {
      return await CurriculumSubjectRepository.create({
        curriculumId: curr.id,
        courseId: normalizedCourseId,
        semesterNo: normalizedSemesterNo,
        isSpecializationSpecific: normalizedFlag,
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new CurriculumServiceError(
          409,
          "This subject is already linked to this curriculum.",
        );
      }
      throw err;
    }
  }

  static async removeSubject(curriculumId: string, courseId: string) {
    const curr = await CurriculumRepository.findFirstByCurriculumIdOrId(
      curriculumId,
    );
    if (!curr) {
      throw new CurriculumServiceError(404, "Curriculum not found");
    }

    return CurriculumSubjectRepository.deleteByCompoundKey(curr.id, courseId);
  }
}
