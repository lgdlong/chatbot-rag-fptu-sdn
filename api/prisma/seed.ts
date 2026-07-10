import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD_HASH = "$2a$10$7Z8bUaR03C2Nn55rKk9Y/u9TjWpeZ2d/lHnK4P50W5W94JmC5a5/G"

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu (Seeding)...')

  // 1. Dọn dẹp dữ liệu cũ (Xóa cascade theo mối quan hệ)
  await prisma.curriculumSubject.deleteMany()
  await prisma.syllabusMaterial.deleteMany()
  await prisma.syllabusClo.deleteMany()
  await prisma.syllabusSchedule.deleteMany()
  await prisma.constructiveQuestion.deleteMany()
  await prisma.assessmentScheme.deleteMany()
  await prisma.syllabusReference.deleteMany()
  await prisma.videoLink.deleteMany()
  await prisma.document.deleteMany()
  await prisma.syllabus.deleteMany()
  await prisma.course.deleteMany()
  await prisma.curriculum.deleteMany()
  await prisma.specialization.deleteMany()
  await prisma.major.deleteMany()
  await prisma.emailWhitelist.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Đã dọn sạch cơ sở dữ liệu cũ.')

  // 2. Seed Email Whitelist cho sinh viên
  const whitelistEmails = [
    'student1@fpt.edu.vn',
    'student2@fpt.edu.vn',
    'longld@fpt.edu.vn',
    'longlgd@fpt.edu.vn',
    'test@fpt.edu.vn',
    'student-test@fpt.edu.vn',
    'lecturer-test@fpt.edu.vn',
    'admin-test@fpt.edu.vn'
  ]

  for (const email of whitelistEmails) {
    await prisma.emailWhitelist.create({
      data: { email }
    })
  }
  console.log(`📧 Đã nạp ${whitelistEmails.length} email sinh viên vào Whitelist.`);

  // 3. Seed Ngành học (Major)
  const majorSE = await prisma.major.create({
    data: {
      code: 'SE',
      name: 'Software Engineering',
      description: 'Kỹ thuật phần mềm - Đại học FPT'
    }
  })
  console.log('🏫 Đã tạo Ngành học: Software Engineering')

  // 4. Seed Chuyên ngành hẹp (Specialization)
  const specNJS = await prisma.specialization.create({
    data: {
      majorId: majorSE.id,
      code: 'NJS',
      name: 'React & NodeJS Fullstack',
      description: 'Chuyên sâu phát triển ứng dụng Web hiện đại với NodeJS và React'
    }
  })

  const specNET = await prisma.specialization.create({
    data: {
      majorId: majorSE.id,
      code: 'NET',
      name: '.NET Cross-platform',
      description: 'Chuyên sâu phát triển ứng dụng doanh nghiệp đa nền tảng với .NET'
    }
  })
  console.log('🎯 Đã tạo Chuyên ngành hẹp: NJS, NET')

  // 5. Seed Khung chương trình đào tạo (Curriculum)
  const curriculum = await prisma.curriculum.create({
    data: {
      curriculumId: 'BIT_SE_NJS_19B',
      majorId: majorSE.id,
      specializationId: specNJS.id,
      batchCode: '19B'
    }
  })
  console.log(`📋 Đã tạo Khung chương trình đào tạo: ${curriculum.curriculumId}`)

  // 6. Seed các Môn học (Subject / Course)
  const subjectsData = [
    // Kỳ 1-4: Đại cương
    { code: 'PRF192', name: 'Programming Fundamentals' },
    { code: 'PRO192', name: 'Object-Oriented Programming' },
    { code: 'MAD101', name: 'Discrete Mathematics' },
    { code: 'OSG202', name: 'Operating Systems' },
    { code: 'DBI202', name: 'Introduction to Databases' },
    // Kỳ 5+: Dùng chung lõi SE
    { code: 'SWE201c', name: 'Introduction to Software Engineering' },
    { code: 'SWR302', name: 'Software Requirement' },
    { code: 'SWT301', name: 'Software Testing' },
    { code: 'SWP391', name: 'Software Development Project' },
    { code: 'SWD392', name: 'Software Architecture & Design' },
    // Kỳ 5+: Đặc thù Chuyên ngành hẹp NJS (4 môn đặc thù)
    { code: 'FER202', name: 'Front-End Web Development with React' },
    { code: 'SDN302', name: 'Server-Side Development with NodeJS' },
    { code: 'MMA301', name: 'Multiplatform Mobile App Development' },
    { code: 'WDP301', name: 'Web Development Project' },
    { code: 'PRN232', name: 'Building Cross-Platform Back-End Application With .NET' }
  ]

  const subjects: Record<string, any> = {}
  for (const sub of subjectsData) {
    subjects[sub.code] = await prisma.course.create({
      data: {
        code: sub.code,
        name: sub.name
      }
    })
  }
  console.log(`📖 Đã tạo ${subjectsData.length} môn học trong DB.`);

  // 6.2 Seed detailed Syllabus for FER202 and PRN232 from JSON files
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const seedSyllabusFromJson = async (jsonFileName: string, courseCode: string) => {
    const filePath = path.resolve(__dirname, '../../web/app/imports', jsonFileName)
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Không tìm thấy file JSON syllabus tại: ${filePath}`)
      return
    }

    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    const { metadata, materials, clos, schedule, assessment_scheme } = data
    const course = subjects[courseCode]

    if (!course) {
      console.log(`⚠️ Không tìm thấy môn học tương ứng trong DB: ${courseCode}`)
      return
    }

    const syllabusId = parseInt(metadata.syllabus_id, 10)

    await prisma.syllabus.create({
      data: {
        id: syllabusId,
        courseId: course.id,
        syllabusName: metadata.syllabus_name,
        syllabusNameEnglish: metadata.syllabus_name_english,
        credits: parseInt(metadata.credits, 10) || 3,
        degreeLevel: metadata.degree_level || 'Bachelor',
        timeAllocation: metadata.time_allocation || '',
        prerequisites: metadata.prerequisites || '',
        description: metadata.description || '',
        studentTasks: metadata.student_tasks || '',
        tools: metadata.tools || '',
        scoringScale: metadata.scoring_scale || '10',
        decisionNo: metadata.decision_no || '',
        minAvgMarkToPass: parseFloat(metadata.min_avg_mark_to_pass) || 5.00,
        isApproved: metadata.is_approved === 'True' || metadata.is_approved === true,
        isActive: metadata.is_active === 'True' || metadata.is_active === true,
        note: metadata.note || '',
        
        materials: {
          create: (materials || []).map((m: any) => ({
            description: m.description,
            author: m.author || null,
            publisher: m.publisher || null,
            publishedDate: m.published_date || null,
            edition: m.edition || null,
            isbn: m.isbn || null,
            isMainMaterial: m.is_main_material || null,
            isHardCopy: m.is_hard_copy || null,
            isOnline: m.is_online || null,
            note: m.note || null,
          }))
        },
        clos: {
          create: (clos || []).map((c: any) => ({
            cloName: c.clo_name,
            cloDetails: c.clo_details,
            loDetails: c.lo_details || null,
          }))
        },
        schedules: {
          create: (schedule || []).map((s: any) => ({
            session: parseInt(s.session, 10),
            topic: s.topic,
            learningMethod: s.learning_method || null,
            lo: s.lo || null,
            itu: s.itu || null,
            studentMaterials: s.student_materials || null,
            sDownload: s.s_download || null,
            studentTasks: s.student_tasks || null,
            urls: s.urls || null,
          }))
        },
        assessments: {
          create: (assessment_scheme || []).map((a: any) => ({
            category: a.category,
            type: a.type || null,
            part: a.part || null,
            weight: parseFloat(a.weight) || 0.00,
            completionCriteria: a.completion_criteria || null,
            duration: a.duration || null,
            clo: a.clo || null,
            questionType: a.question_type || null,
            noQuestion: a.no_question || null,
            knowledgeAndSkill: a.knowledge_and_skill || null,
            gradingGuide: a.grading_guide || null,
            note: a.note || null,
          }))
        }
      }
    })

    // Create a mock document to make the syllabus accessible by the chatbot
    await prisma.document.create({
      data: {
        id: `mock-doc-id-${syllabusId}`,
        name: `${metadata.subject_code}_Syllabus_Official.pdf`,
        fileUrl: `/uploads/${metadata.subject_code}_Syllabus_Official.pdf`,
        fileType: "pdf",
        status: "COMPLETED",
        syllabusId: syllabusId,
      }
    });

    console.log(`ℹ️ Đã nạp chi tiết Syllabus và mock Document từ ${jsonFileName} cho môn học ${courseCode}`);
  }

  await seedSyllabusFromJson('20260522_133015_FER202_details.json', 'FER202')
  await seedSyllabusFromJson('20260522_223218_PRN232_details.json', 'PRN232')

  // 7. Seed CurriculumSubject (N:M liên kết khung CTĐT và môn học)
  const curriculumSubjects = [
    // Môn chung
    { courseId: subjects['PRF192'].id, semesterNo: 1, isSpecializationSpecific: false },
    { courseId: subjects['PRO192'].id, semesterNo: 2, isSpecializationSpecific: false },
    { courseId: subjects['MAD101'].id, semesterNo: 2, isSpecializationSpecific: false },
    { courseId: subjects['DBI202'].id, semesterNo: 3, isSpecializationSpecific: false },
    { courseId: subjects['OSG202'].id, semesterNo: 3, isSpecializationSpecific: false },
    { courseId: subjects['SWE201c'].id, semesterNo: 4, isSpecializationSpecific: false },
    { courseId: subjects['SWR302'].id, semesterNo: 5, isSpecializationSpecific: false },
    { courseId: subjects['SWT301'].id, semesterNo: 5, isSpecializationSpecific: false },
    { courseId: subjects['SWP391'].id, semesterNo: 6, isSpecializationSpecific: false },
    { courseId: subjects['SWD392'].id, semesterNo: 6, isSpecializationSpecific: false },
    // 4 Môn đặc thù NodeJS
    { courseId: subjects['FER202'].id, semesterNo: 5, isSpecializationSpecific: true },
    { courseId: subjects['SDN302'].id, semesterNo: 7, isSpecializationSpecific: true },
    { courseId: subjects['MMA301'].id, semesterNo: 7, isSpecializationSpecific: true },
    { courseId: subjects['WDP301'].id, semesterNo: 8, isSpecializationSpecific: true }
  ]

  for (const cs of curriculumSubjects) {
    await prisma.curriculumSubject.create({
      data: {
        curriculumId: curriculum.id,
        courseId: cs.courseId,
        semesterNo: cs.semesterNo,
        isSpecializationSpecific: cs.isSpecializationSpecific
      }
    })
  }
  console.log('🔗 Đã liên kết các môn học vào Khung chương trình BIT_SE_NJS_19B.');

  // 8. Seed Admin User & Account
  const adminUser = await prisma.user.create({
    data: {
      id: 'default_admin_id',
      name: 'Default Admin',
      email: 'admin@fpt.edu.vn',
      role: 'ADMIN'
    }
  })

  await prisma.account.create({
    data: {
      id: 'default_admin_account_id',
      accountId: 'admin@fpt.edu.vn',
      providerId: 'credential',
      userId: adminUser.id,
      password: DEFAULT_PASSWORD_HASH
    }
  })

  console.log('🛡️ Đã tạo tài khoản ADMIN mặc định:');
  console.log('   - Email: admin@fpt.edu.vn');
  console.log('   - Mật khẩu mặc định: dùng chung giá trị hash cấu hình sẵn trong seed');

  // 9. Seed giảng viên mặc định
  const lecturerUser = await prisma.user.create({
    data: {
      id: 'default_lecturer_id',
      name: 'Teacher FPTU',
      email: 'teacher@fpt.edu.vn',
      role: 'LECTURER'
    }
  })

  await prisma.account.create({
    data: {
      id: 'default_lecturer_account_id',
      accountId: 'teacher@fpt.edu.vn',
      providerId: 'credential',
      userId: lecturerUser.id,
      password: DEFAULT_PASSWORD_HASH // Cùng mật khẩu
    }
  })
  console.log('👨‍🏫 Đã tạo tài khoản giảng viên mặc định:');
  console.log('   - Email: teacher@fpt.edu.vn');
  console.log('   - Mật khẩu mặc định: dùng chung giá trị hash cấu hình sẵn trong seed');

  console.log('🎉 Quá trình Seeding hoàn tất thành công!');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Lỗi khi chạy Seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
