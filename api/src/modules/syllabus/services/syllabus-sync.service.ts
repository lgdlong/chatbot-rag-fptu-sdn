import { AnythingLlmAdapter } from "../../rag/services/anythingllm.adapter.js";
import { RagWorkspaceRepository } from "../repositories/rag-workspace.repository.js";
import { SyllabusRepository } from "../repositories/syllabus.repository.js";

export class SyllabusSyncService {
  /**
   * Sinh nội dung Markdown hoàn chỉnh của Syllabus dựa trên dữ liệu có cấu trúc từ DB.
   */
  public static async generateMarkdown(syllabusId: number): Promise<string> {
    const syllabus = await SyllabusRepository.findById(syllabusId, { deep: true });

    if (!syllabus) {
      throw new Error(`Syllabus with ID ${syllabusId} not found`);
    }

    let md = `# Đề cương chi tiết môn học: ${syllabus.syllabusName}\n`;
    if (syllabus.syllabusNameEnglish) {
      md += `## English Title: ${syllabus.syllabusNameEnglish}\n\n`;
    }

    md += `### 1. Thông tin chung (General Information)\n`;
    md += `- **Mã môn học (Subject Code):** ${syllabus.course.code}\n`;
    md += `- **Tên môn học (Subject Name):** ${syllabus.course.name}\n`;
    md += `- **Số tín chỉ (Credits):** ${syllabus.credits}\n`;
    md += `- **Trình độ đào tạo (Degree Level):** ${syllabus.degreeLevel}\n`;
    if (syllabus.timeAllocation) {
      md += `- **Phân bổ thời gian (Time Allocation):** ${syllabus.timeAllocation}\n`;
    }
    if (syllabus.prerequisites) {
      md += `- **Môn tiên quyết (Prerequisites):** ${syllabus.prerequisites}\n`;
    }
    md += `- **Thang điểm (Scoring Scale):** ${syllabus.scoringScale}\n`;
    md += `- **Điểm trung bình tối thiểu để qua môn (Min Average Mark to Pass):** ${syllabus.minAvgMarkToPass}\n`;
    if (syllabus.decisionNo) {
      md += `- **Số quyết định ban hành (Decision No):** ${syllabus.decisionNo}\n`;
    }
    if (syllabus.approvedDate) {
      md += `- **Ngày phê duyệt (Approved Date):** ${syllabus.approvedDate.toISOString().split("T")[0]}\n`;
    }
    md += `\n`;

    if (syllabus.description) {
      md += `### 2. Mô tả môn học (Course Description)\n`;
      md += `${syllabus.description}\n\n`;
    }

    if (syllabus.studentTasks) {
      md += `### 3. Nhiệm vụ của sinh viên (Student Tasks)\n`;
      md += `${syllabus.studentTasks}\n\n`;
    }

    if (syllabus.tools) {
      md += `### 4. Công cụ học tập (Tools & Software)\n`;
      md += `${syllabus.tools}\n\n`;
    }

    if (syllabus.clos.length > 0) {
      md += `### 5. Chuẩn đầu ra môn học (Course Learning Outcomes - CLOs)\n`;
      syllabus.clos.forEach((clo: { cloName: string; cloDetails: string; loDetails: string | null }) => {
        md += `- **${clo.cloName}:** ${clo.cloDetails}\n`;
        if (clo.loDetails) {
          md += `  - Ánh xạ chuẩn đầu ra chương trình (LO): ${clo.loDetails}\n`;
        }
      });
      md += `\n`;
    }

    if (syllabus.assessments.length > 0) {
      md += `### 6. Cơ cấu đánh giá (Assessment Scheme)\n`;
      md += `| Đầu điểm (Category) | Hình thức (Type) | Trọng số (Weight) | Chuẩn đầu ra (CLO) | Hướng dẫn/Ghi chú |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      syllabus.assessments.forEach((a: { category: string; type: string | null; weight: unknown; clo: string | null; completionCriteria: string | null; gradingGuide: string | null; note: string | null }) => {
        md += `| ${a.category} | ${a.type || "N/A"} | ${a.weight}% | ${a.clo || "N/A"} | ${a.completionCriteria || ""} ${a.gradingGuide || ""} ${a.note || ""} |\n`;
      });
      md += `\n`;
    }

    if (syllabus.schedules.length > 0) {
      md += `### 7. Lịch trình học tập (Schedules)\n`;
      md += `| Buổi (Session) | Chủ đề (Topic) | Hình thức (Method) | Đáp ứng CLO | Nhiệm vụ sinh viên |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      syllabus.schedules.forEach((s: { session: number; topic: string; learningMethod: string | null; lo: string | null; studentTasks: string | null }) => {
        md += `| Buổi ${s.session} | ${s.topic} | ${s.learningMethod || "N/A"} | ${s.lo || "N/A"} | ${s.studentTasks || "N/A"} |\n`;
      });
      md += `\n`;
    }

    if (syllabus.materials.length > 0) {
      md += `### 8. Giáo trình & Học liệu chính (Main Materials)\n`;
      syllabus.materials.forEach((m: { isMainMaterial: string | null; description: string; author: string | null; publisher: string | null; publishedDate: string | null }) => {
        md += `- **[${m.isMainMaterial || "Material"}] ${m.description}**\n`;
        if (m.author) md += `  - Tác giả (Author): ${m.author}\n`;
        if (m.publisher) md += `  - Nhà xuất bản (Publisher): ${m.publisher} (${m.publishedDate || ""})\n`;
      });
      md += `\n`;
    }

    if (syllabus.references.length > 0) {
      md += `### 9. Tài liệu tham khảo (References)\n`;
      syllabus.references.forEach((r: { citation: string }) => {
        md += `- ${r.citation}\n`;
      });
      md += `\n`;
    }

    return md;
  }

  /**
   * Đồng bộ Snapshot Markdown của Syllabus lên AnythingLLM workspace.
   */
  public static async syncSyllabusToAnythingLlm(syllabusId: number): Promise<void> {
    const syllabus = await SyllabusRepository.findByIdLight(syllabusId, {
      select: { id: true, syllabusName: true, course: { select: { code: true } } },
    });
    if (!syllabus) {
      throw new Error(`Syllabus with ID ${syllabusId} not found`);
    }

    const workspaceSlug = `${syllabus.course.code.toLowerCase()}_${syllabus.id}`;
    const workspaceName = `${syllabus.course.code} - ${syllabus.syllabusName}`;

    // 1. Sinh nội dung markdown mới
    const mdContent = await this.generateMarkdown(syllabusId);
    const fileName = `syllabus_${syllabus.id}_snapshot.md`;

    // 2. Đảm bảo workspace tồn tại trong AnythingLLM
    console.log(`[Syllabus Sync] Ensuring AnythingLLM workspace "${workspaceSlug}" exists`);
    await AnythingLlmAdapter.ensureWorkspace(workspaceSlug);

    // 3. Đăng ký hoặc lấy thông tin RagWorkspace trong DB
    const ragWorkspace = await RagWorkspaceRepository.upsertBySyllabus({
      syllabusId,
      workspaceSlug,
      workspaceName,
    });

    // 4. Nếu đã có snapshot cũ, tiến hành xóa khỏi AnythingLLM
    const oldLocation = ragWorkspace.anythingLlmId;
    if (oldLocation) {
      try {
        console.log(`[Syllabus Sync] Removing old snapshot embedding: "${oldLocation}"`);
        await AnythingLlmAdapter.updateWorkspaceEmbeddings(workspaceSlug, { deletes: [oldLocation] });
        console.log(`[Syllabus Sync] Purging old snapshot document: "${oldLocation}"`);
        await AnythingLlmAdapter.purgeDocuments([oldLocation]);
      } catch (err) {
        console.error(`[Syllabus Sync] Non-blocking warning: Failed to clean up old snapshot "${oldLocation}":`, err);
      }
    }

    // 5. Tải lên snapshot markdown mới
    console.log(`[Syllabus Sync] Uploading new snapshot markdown for syllabus: ${syllabus.id}`);
    const newLocation = await AnythingLlmAdapter.uploadMarkdown(fileName, mdContent);

    // 6. Nhúng snapshot vào workspace
    console.log(`[Syllabus Sync] Embedding new snapshot markdown into workspace: "${workspaceSlug}"`);
    await AnythingLlmAdapter.updateWorkspaceEmbeddings(workspaceSlug, { adds: [newLocation] });

    // 7. Cập nhật ID/Location snapshot mới vào DB
    await RagWorkspaceRepository.update(ragWorkspace.id, {
      anythingLlmId: newLocation,
    });

    console.log(`[Syllabus Sync] Successfully synced snapshot markdown to AnythingLLM workspace "${workspaceSlug}"!`);
  }
}
