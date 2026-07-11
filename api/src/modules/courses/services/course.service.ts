// Phase 0.2 stub -- implemented in Track D.

export class CourseService {
  static async listAll() {
    throw new Error("CourseService.listAll not implemented");
  }

  static async listWithDocumentCount() {
    throw new Error("CourseService.listWithDocumentCount not implemented");
  }

  static async create(input: { code: string; name: string }) {
    throw new Error("CourseService.create not implemented");
  }

  static async update(id: string, input: { code: string; name: string }) {
    throw new Error("CourseService.update not implemented");
  }

  static async delete(id: string) {
    throw new Error("CourseService.delete not implemented");
  }

  static async findByCode(code: string) {
    throw new Error("CourseService.findByCode not implemented");
  }

  static async findById(id: string) {
    throw new Error("CourseService.findById not implemented");
  }

  static async getCourseWithSyllabuses(id: string) {
    throw new Error("CourseService.getCourseWithSyllabuses not implemented");
  }
}
