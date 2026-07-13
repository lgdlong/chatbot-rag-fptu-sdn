/**
 * Demo datasets for syllabus creation form — 3 bộ data khác nhau.
 * Dùng với nút "Điền nhanh" trong form tạo syllabus.
 * Format: Record<string, FormData> với key = tên bộ data.
 */

// ─── Types ───
export interface DemoAssessment {
  category: string;
  type: string;
  part: string;
  weight: number;
  completionCriteria: string;
  duration: string;
  clo: string;
  questionType: string;
  noQuestion: string;
  knowledgeAndSkill: string;
  gradingGuide: string;
  note: string;
}

export interface DemoSchedule {
  session: number;
  topic: string;
  learningMethod: string;
  lo: string;
  studentTasks: string;
  itu: string;
  studentMaterials: string;
  sDownload: string;
  urls: string;
}

export interface DemoClo {
  cloName: string;
  cloDetails: string;
  loDetails: string;
}

export interface DemoMaterial {
  description: string;
  author: string;
  publisher: string;
  publishedDate: string;
  edition: string;
  isbn: string;
  isMainMaterial: string;
  isHardCopy: string;
  isOnline: string;
  note: string;
}

export interface DemoFormData {
  courseId: string;
  syllabusName: string;
  syllabusNameEnglish: string;
  credits: number;
  prerequisites: string;
  description: string;
  studentTasks: string;
  tools: string;
  scoringScale: string;
  minAvgMarkToPass: number;
  decisionNo: string;
  note: string;
  degreeLevel: string;
  timeAllocation: string;
  clos: DemoClo[];
  schedules: DemoSchedule[];
  assessments: DemoAssessment[];
  materials: DemoMaterial[];
}

// ─── 3 Demo Datasets ───

export const DEMO_DATASETS: Record<string, DemoFormData> = {

  // ──────────────────────────────────────────────
  // 1. FER202 — Front-End Web Development with React
  // ──────────────────────────────────────────────
  FER202: {
    courseId: "", // dynamic — filled when selecting course
    syllabusName: "Front-End Web Development with React",
    syllabusNameEnglish: "Front-End Web Development with React",
    credits: 3,
    prerequisites: "WED201c, PRO192",
    description: `This course provides students with comprehensive knowledge and practical skills in modern front-end web development using React. Students will learn component-based architecture, state management, routing, and integration with RESTful APIs. The course emphasizes building responsive, performant single-page applications (SPAs) following industry best practices.

Topics covered: JSX, Components, Props, State, Lifecycle, Hooks, React Router, Context API, Redux, Testing with Jest, and Deployment.`,
    studentTasks: `- Attend at least 80% of classes
- Complete all weekly assignments and submit on time
- Build a complete React application as the final project
- Participate in code reviews and peer feedback sessions
- Read assigned materials before each class`,
    tools: "VS Code, Node.js 20+, React DevTools, Chrome DevTools, Git, npm/yarn, Postman",
    scoringScale: "10",
    minAvgMarkToPass: 5,
    decisionNo: "359/QĐ-ĐHFPT dated 04/09/2025",
    note: "Syllabus chuẩn cho khối kiến thức chuyên ngành NJS",
    degreeLevel: "Bachelor",
    timeAllocation: `Study hour (150h):
- Self-paced online learning: 30 hours
- Face-to-face with instructor: 45 hours (15 sessions x 3 hours)
- Lab/Practical: 30 hours
- Self-study & assignments: 45 hours`,
    clos: [
      { cloName: "CLO1", cloDetails: "Analyze and design React component hierarchies for web applications", loDetails: "LO1.1, LO1.2" },
      { cloName: "CLO2", cloDetails: "Implement state management solutions using React Hooks and Context API", loDetails: "LO2.1, LO2.2" },
      { cloName: "CLO3", cloDetails: "Build client-side routing with React Router and handle authentication flows", loDetails: "LO3.1" },
      { cloName: "CLO4", cloDetails: "Integrate RESTful APIs and manage asynchronous data flow in React", loDetails: "LO4.1, LO4.2" },
      { cloName: "CLO5", cloDetails: "Test React components using Jest and React Testing Library", loDetails: "LO5.1" },
    ],
    schedules: [
      { session: 1, topic: "Week 1: Introduction to React & JSX", learningMethod: "Online, Offline", lo: "CLO1", studentTasks: "Watch video lectures. Setup development environment.", itu: "IT", studentMaterials: "Official React docs (react.dev), video tutorials", sDownload: "Setup-guide.pdf, React-cheatsheet.pdf", urls: "https://react.dev/learn" },
      { session: 2, topic: "Week 2: Components & Props", learningMethod: "Online, Offline", lo: "CLO1", studentTasks: "Build a static component tree. Complete lab exercise.", itu: "T", studentMaterials: "Chapter 2 - Thinking in React", sDownload: "lab-2-components.zip", urls: "https://react.dev/learn/thinking-in-react" },
      { session: 3, topic: "Week 3: State & Lifecycle", learningMethod: "Online, Offline", lo: "CLO1, CLO2", studentTasks: "Implement stateful components. Complete interactive exercise.", itu: "T", studentMaterials: "Chapter 3 - State Management", sDownload: "lab-3-state.zip", urls: "https://react.dev/learn/state-a-component-memory" },
      { session: 4, topic: "Week 4: React Hooks (useState, useEffect, useRef)", learningMethod: "Online, Offline", lo: "CLO2", studentTasks: "Refactor class components to hooks. Practice exercises.", itu: "T,U", studentMaterials: "Hooks API reference", sDownload: "lab-4-hooks.zip", urls: "https://react.dev/reference/react/hooks" },
      { session: 5, topic: "Week 5: Advanced Hooks (useContext, useReducer)", learningMethod: "Online, Offline", lo: "CLO2", studentTasks: "Implement global state with Context + useReducer.", itu: "T,U", studentMaterials: "Chapter 5 - Context API", sDownload: "lab-5-context.zip", urls: "https://react.dev/learn/passing-data-deeply-with-context" },
      { session: 6, topic: "Week 6: React Router & Navigation", learningMethod: "Online, Offline", lo: "CLO3", studentTasks: "Build multi-page SPA with routing and navigation guards.", itu: "T", studentMaterials: "React Router v6 docs", sDownload: "lab-6-router.zip", urls: "https://reactrouter.com/en/main" },
      { session: 7, topic: "Week 7: Forms & Validation", learningMethod: "Online, Offline", lo: "CLO3", studentTasks: "Build complex forms with validation and error handling.", itu: "T,U", studentMaterials: "Form libraries comparison (Formik, React Hook Form)", sDownload: "lab-7-forms.zip", urls: "https://react-hook-form.com/" },
      { session: 8, topic: "Week 8: API Integration & Data Fetching", learningMethod: "Online, Offline", lo: "CLO4", studentTasks: "Implement data fetching with fetch API and Axios. Handle loading/error states.", itu: "T", studentMaterials: "REST API best practices", sDownload: "lab-8-api.zip", urls: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API" },
    ],
    assessments: [
      { category: "Progress Test 1", type: "on-going", part: "1", weight: 10, completionCriteria: "5/10", duration: "45'", clo: "CLO1, CLO2", questionType: "Multiple Choice", noQuestion: "20", knowledgeAndSkill: "JSX, Components, Props, State, Hooks basics", gradingGuide: "0.5 điểm/câu trắc nghiệm", note: "" },
      { category: "Progress Test 2", type: "on-going", part: "1", weight: 10, completionCriteria: "5/10", duration: "45'", clo: "CLO3, CLO4", questionType: "Multiple Choice + Coding", noQuestion: "15", knowledgeAndSkill: "Router, Forms, API Integration", gradingGuide: "MCQ: 0.5đ, Coding: cấu trúc 2đ, logic 3đ", note: "" },
      { category: "Group Assignment", type: "on-going", part: "1", weight: 20, completionCriteria: "5/10", duration: "2 weeks", clo: "CLO1-CLO5", questionType: "Project", noQuestion: "1", knowledgeAndSkill: "Full React SPA development", gradingGuide: "Design 20%, Functionality 40%, Code quality 20%, Presentation 20%", note: "Nhóm 4-5 SV" },
      { category: "Lab Exercises", type: "on-going", part: "1", weight: 10, completionCriteria: "5/10", duration: "Weekly", clo: "CLO1-CLO4", questionType: "Lab", noQuestion: "8", knowledgeAndSkill: "Thực hành hàng tuần", gradingGuide: "10% mỗi lab, tính trung bình 8 bài", note: "" },
      { category: "Final Exam", type: "final exam", part: "1", weight: 50, completionCriteria: "5/10", duration: "120'", clo: "CLO1-CLO5", questionType: "Coding + Essay", noQuestion: "5", knowledgeAndSkill: "Toàn bộ kiến thức môn học", gradingGuide: "Mỗi câu 2đ, yêu cầu code chạy được", note: "Thi thực hành trên máy" },
    ],
    materials: [
      { description: "Learning React, 2nd Edition", author: "Alex Banks & Eve Porcello", publisher: "O'Reilly Media", publishedDate: "2020", edition: "2nd Edition", isbn: "978-1492051729", isMainMaterial: "Main", isHardCopy: "Có", isOnline: "Có", note: "Sách giáo trình chính" },
      { description: "React - The Complete Guide (Video)", author: "Academind (Maximilian Schwarzmüller)", publisher: "Udemy", publishedDate: "2024", edition: "2024 Edition", isbn: "N/A", isMainMaterial: "Reference", isHardCopy: "Không", isOnline: "Có", note: "Khóa học online bổ trợ" },
      { description: "React Documentation (Official)", author: "Meta Open Source", publisher: "react.dev", publishedDate: "2024", edition: "Latest", isbn: "N/A", isMainMaterial: "Reference", isHardCopy: "Không", isOnline: "Có", note: "https://react.dev" },
    ],
  },

  // ──────────────────────────────────────────────
  // 2. SDN302 — Server-Side Development with NodeJS
  // ──────────────────────────────────────────────
  SDN302: {
    courseId: "",
    syllabusName: "Server-Side Development with NodeJS",
    syllabusNameEnglish: "Server-Side Development with NodeJS",
    credits: 3,
    prerequisites: "PRO192, SWE201c",
    description: `This course covers server-side web development using Node.js and Express.js. Students will learn to build scalable RESTful APIs, handle authentication and authorization, work with databases (MongoDB & PostgreSQL), implement real-time communication with WebSocket, and deploy applications to production.

Topics include: Node.js runtime, Express.js framework, REST API design, MongoDB/Mongoose, PostgreSQL/Prisma, JWT authentication, Socket.IO, testing, and deployment with Docker.`,
    studentTasks: `- Attend at least 80% of lectures and labs
- Complete weekly coding assignments
- Build a complete REST API as the final project
- Participate in code reviews
- Maintain a GitHub repository for all lab work`,
    tools: "VS Code, Node.js 20+, Express.js, MongoDB Compass, Postman/Insomnia, Docker Desktop, Git, Prisma Studio",
    scoringScale: "10",
    minAvgMarkToPass: 5,
    decisionNo: "359/QĐ-ĐHFPT dated 04/09/2025",
    note: "Syllabus chuẩn cho khối kiến thức chuyên ngành NJS",
    degreeLevel: "Bachelor",
    timeAllocation: `Study hour (150h):
- Self-paced online learning: 30 hours
- Face-to-face with instructor: 45 hours (15 sessions x 3 hours)
- Lab/Practical: 30 hours
- Self-study & assignments: 45 hours`,
    clos: [
      { cloName: "CLO1", cloDetails: "Design and implement RESTful APIs using Express.js", loDetails: "LO1.1, LO1.2" },
      { cloName: "CLO2", cloDetails: "Integrate MongoDB and PostgreSQL databases with Node.js applications", loDetails: "LO2.1, LO2.2, LO2.3" },
      { cloName: "CLO3", cloDetails: "Implement authentication and authorization using JWT and OAuth2", loDetails: "LO3.1" },
      { cloName: "CLO4", cloDetails: "Build real-time features using WebSocket (Socket.IO)", loDetails: "LO4.1" },
      { cloName: "CLO5", cloDetails: "Test and deploy Node.js applications to production", loDetails: "LO5.1, LO5.2" },
    ],
    schedules: [
      { session: 1, topic: "Week 1: Node.js Fundamentals", learningMethod: "Online, Offline", lo: "CLO1", studentTasks: "Setup Node.js. Build CLI tools with Node.", itu: "IT", studentMaterials: "Node.js docs, video tutorials", sDownload: "setup-guide.zip", urls: "https://nodejs.org/en/docs" },
      { session: 2, topic: "Week 2: Express.js & Routing", learningMethod: "Online, Offline", lo: "CLO1", studentTasks: "Build first Express app. Implement CRUD routes.", itu: "T", studentMaterials: "Express.js guide", sDownload: "lab-2-express.zip", urls: "https://expressjs.com/" },
      { session: 3, topic: "Week 3: Middleware & Error Handling", learningMethod: "Online, Offline", lo: "CLO1", studentTasks: "Implement custom middleware. Build error handling layer.", itu: "T,U", studentMaterials: "Express middleware docs", sDownload: "lab-3-middleware.zip", urls: "https://expressjs.com/en/guide/using-middleware.html" },
      { session: 4, topic: "Week 4: MongoDB with Mongoose", learningMethod: "Online, Offline", lo: "CLO2", studentTasks: "Design MongoDB schemas. Implement CRUD with Mongoose.", itu: "T", studentMaterials: "Mongoose docs", sDownload: "lab-4-mongoose.zip", urls: "https://mongoosejs.com/" },
      { session: 5, topic: "Week 5: PostgreSQL with Prisma", learningMethod: "Online, Offline", lo: "CLO2", studentTasks: "Design relational schema. Use Prisma migrations.", itu: "T,U", studentMaterials: "Prisma docs", sDownload: "lab-5-prisma.zip", urls: "https://www.prisma.io/docs" },
      { session: 6, topic: "Week 6: Authentication (JWT & OAuth)", learningMethod: "Online, Offline", lo: "CLO3", studentTasks: "Implement JWT auth. Add Google OAuth login.", itu: "T", studentMaterials: "JWT + OAuth2 guides", sDownload: "lab-6-auth.zip", urls: "https://jwt.io/introduction" },
      { session: 7, topic: "Week 7: Authorization & RBAC", learningMethod: "Online, Offline", lo: "CLO3", studentTasks: "Implement role-based access control.", itu: "T,U", studentMaterials: "RBAC patterns", sDownload: "lab-7-rbac.zip", urls: "" },
      { session: 8, topic: "Week 8: Real-time with Socket.IO", learningMethod: "Online, Offline", lo: "CLO4", studentTasks: "Build real-time chat feature using Socket.IO.", itu: "T", studentMaterials: "Socket.IO docs", sDownload: "lab-8-socket.zip", urls: "https://socket.io/docs/v4/" },
    ],
    assessments: [
      { category: "Progress Test 1", type: "on-going", part: "1", weight: 10, completionCriteria: "5/10", duration: "45'", clo: "CLO1, CLO2", questionType: "Multiple Choice", noQuestion: "20", knowledgeAndSkill: "Node.js, Express, MongoDB, Prisma", gradingGuide: "0.5 điểm/câu", note: "" },
      { category: "Progress Test 2", type: "on-going", part: "1", weight: 10, completionCriteria: "5/10", duration: "45'", clo: "CLO3, CLO4", questionType: "Coding", noQuestion: "3", knowledgeAndSkill: "Auth, Socket.IO, Testing", gradingGuide: "Mỗi câu 3-4đ", note: "" },
      { category: "Practical Lab", type: "on-going", part: "1", weight: 20, completionCriteria: "5/10", duration: "Weekly", clo: "CLO1-CLO5", questionType: "Lab Exercise", noQuestion: "8", knowledgeAndSkill: "Thực hành Node.js", gradingGuide: "Trung bình 8 bài lab", note: "Nộp qua GitHub" },
      { category: "Group Project", type: "on-going", part: "1", weight: 20, completionCriteria: "5/10", duration: "4 weeks", clo: "CLO1-CLO5", questionType: "Project", noQuestion: "1", knowledgeAndSkill: "Full-stack API development", gradingGuide: "Architecture 20%, Code 40%, Testing 20%, Docs 20%", note: "Nhóm 3-4 SV" },
      { category: "Final Exam", type: "final exam", part: "1", weight: 40, completionCriteria: "5/10", duration: "120'", clo: "CLO1-CLO5", questionType: "Coding + Essay", noQuestion: "5", knowledgeAndSkill: "Toàn bộ kiến thức", gradingGuide: "Mỗi câu 2đ", note: "Thi thực hành" },
    ],
    materials: [
      { description: "Node.js Design Patterns, 3rd Edition", author: "Mario Casciaro", publisher: "Packt Publishing", publishedDate: "2020", edition: "3rd Edition", isbn: "978-1839214110", isMainMaterial: "Main", isHardCopy: "Có", isOnline: "Có", note: "Sách giáo trình chính" },
      { description: "Express in Action", author: "Evan M. Hahn", publisher: "Manning", publishedDate: "2016", edition: "1st Edition", isbn: "978-1617292420", isMainMaterial: "Reference", isHardCopy: "Có", isOnline: "Có", note: "Tài liệu tham khảo Express" },
      { description: "MongoDB: The Definitive Guide, 3rd Edition", author: "Shannon Bradshaw", publisher: "O'Reilly Media", publishedDate: "2019", edition: "3rd Edition", isbn: "978-1492035795", isMainMaterial: "Reference", isHardCopy: "Có", isOnline: "Có", note: "" },
    ],
  },

  // ──────────────────────────────────────────────
  // 3. EXE101 — Experiential Entrepreneurship 1
  // ──────────────────────────────────────────────
  EXE101: {
    courseId: "",
    syllabusName: "Experiential Entrepreneurship 1 - Trải nghiệm khởi nghiệp 1",
    syllabusNameEnglish: "Experiential Entrepreneurship 1",
    credits: 3,
    prerequisites: "None",
    description: `This course will provide students with essential knowledge and tips on starting a start-up efficiently and effectively. The course covers the most important aspects of modern entrepreneurship. Students will study by watching videos shared by prolific startup founders on various topics.

Each week, there will be a face-to-face session with an instructor who will re-cap and check on students' understanding. Students are grouped into teams of 4 to 6 from at least 2 different majors. Each team develops a startup idea and works on the project with guidance from instructors and mentors throughout the course.`,
    studentTasks: `- Attend at least 80% of Instructor's Coaching sessions, Seminars and Mentor's Mentoring
- Complete all exercises and assignments given by the instructor
- Meet all checkpoint requirements
- Use laptop in class only for learning purpose
- Access FLM and Edunext systems for up-to-date information`,
    tools: "- Laptop computer\n- Internet connection\n- Google Meet / Microsoft Teams / Zoom\n- FLM platform (https://flm.fpt.edu.vn)\n- Edunext (https://fu.edunext.vn)",
    scoringScale: "10",
    minAvgMarkToPass: 5,
    decisionNo: "871/QĐ-ĐHFPT dated 08/25/2023",
    note: "Syllabus đại trà cho tất cả sinh viên SE",
    degreeLevel: "Bachelor",
    timeAllocation: `Study hour (150h):
- Self-paced online learning: 15 hours
- Learning face-to-face with an instructor: 10 sessions x 2.25hrs
- Guest speakers' Sharing - Seminars: 3 sessions x 2.25hrs
- Mentors' Mentoring: 2 sessions x 2.25hrs
- Self-study: 102 hours`,
    clos: [
      { cloName: "CLO1", cloDetails: "Demonstrate understanding of key aspects of startup at a basic level", loDetails: "LO1.1" },
      { cloName: "CLO2", cloDetails: "Demonstrate the ability to build a right team and express effective teamwork", loDetails: "LO2.1, LO2.2" },
      { cloName: "CLO3", cloDetails: "Able to conduct survey and do market research", loDetails: "LO3.1" },
      { cloName: "CLO4", cloDetails: "Able to build the right product and the reasonable business model", loDetails: "LO4.1" },
      { cloName: "CLO5", cloDetails: "Able to create a preliminary pitch deck and present it convincingly", loDetails: "LO5.1" },
    ],
    schedules: [
      { session: 1, topic: "Week 1: Instructor's coaching - Spark and nurture entrepreneurial spirit", learningMethod: "Online, Offline", lo: "CLO1", studentTasks: "Watch video lectures. Form a team with 4-6 members.", itu: "IT", studentMaterials: "Sam Altman - How to Start a Startup", sDownload: "1_Slides.zip", urls: "https://startupclass.samaltman.com/courses/lec01/" },
      { session: 2, topic: "Week 1: Seminar 1 - 'Be Successful in Your Own Way'", learningMethod: "Offline", lo: "CLO2", studentTasks: "Attend seminar. Prepare questions for guest speakers.", itu: "T,U", studentMaterials: "", sDownload: "2_Case_studies.zip", urls: "" },
      { session: 3, topic: "Week 2: Form a Winning Team", learningMethod: "Online, Offline", lo: "CLO2", studentTasks: "Watch videos. Assign team roles. Brainstorm startup idea.", itu: "T,U", studentMaterials: "How to Find the Right Co-founder", sDownload: "3_Team_Building.zip", urls: "https://www.ycombinator.com/library/8h-how-to-find-the-right-co-founder" },
      { session: 4, topic: "Week 3: Develop and Evaluate a Startup Idea", learningMethod: "Online, Offline", lo: "CLO3, CLO4", studentTasks: "Present startup idea to class. Get feedback.", itu: "T,U", studentMaterials: "How to Get and Test Ideas", sDownload: "", urls: "https://www.ycombinator.com/library/7x-how-to-get-and-test-ideas" },
      { session: 5, topic: "Week 3: Seminar 2 - 'Choosing a Startup Idea'", learningMethod: "Offline", lo: "CLO3", studentTasks: "Attend seminar with guest speaker.", itu: "I,T", studentMaterials: "", sDownload: "", urls: "" },
      { session: 6, topic: "Week 3: Mentoring 1", learningMethod: "Online", lo: "CLO3, CLO4", studentTasks: "Discuss startup idea with mentor. Get guidance.", itu: "T,U", studentMaterials: "", sDownload: "", urls: "" },
      { session: 7, topic: "Week 4: Understand Customer and Find Market-fit", learningMethod: "Online, Offline", lo: "CLO3, CLO4", studentTasks: "Start market research. Prepare Checkpoint 2.", itu: "T,U", studentMaterials: "How to Talk to Users", sDownload: "", urls: "https://www.ycombinator.com/library/6g-how-to-talk-to-users" },
      { session: 8, topic: "Week 5: Market Research - Customer Discovery", learningMethod: "Offline", lo: "CLO3, CLO4", studentTasks: "Present market research results. Oral presentation.", itu: "T,U", studentMaterials: "Customer discovery guide", sDownload: "", urls: "" },
    ],
    assessments: [
      { category: "Constructivism Presentations", type: "on-going", part: "1", weight: 15, completionCriteria: "5/10", duration: "15'", clo: "all", questionType: "Oral Presentation", noQuestion: "1", knowledgeAndSkill: "Topic from video lectures, class discussion", gradingGuide: "Guided by instructor. Students discuss on group then present.", note: "" },
      { category: "Checkpoint 1 (Group Assignment)", type: "on-going", part: "1", weight: 10, completionCriteria: "5/10", duration: "10'-30'", clo: "CLO1, CLO2", questionType: "Oral Presentation", noQuestion: "1", knowledgeAndSkill: "Team formation, startup idea selection", gradingGuide: "Team roles 20%, Idea 40%, Presentation 40%", note: "Instructor reviews after grading" },
      { category: "Checkpoint 2 (Group Assignment)", type: "on-going", part: "1", weight: 20, completionCriteria: "5/10", duration: "10'-30'", clo: "CLO3", questionType: "Oral Presentation", noQuestion: "1", knowledgeAndSkill: "Market research, competitive analysis", gradingGuide: "Survey 30%, Market analysis 40%, Insights 30%", note: "Instructor reviews after grading" },
      { category: "Checkpoint 3 (Group Assignment)", type: "on-going", part: "1", weight: 15, completionCriteria: "5/10", duration: "10'-30'", clo: "CLO4", questionType: "Oral Presentation", noQuestion: "1", knowledgeAndSkill: "Business model canvas, product description", gradingGuide: "Product 30%, Business model 40%, Tech description 30%", note: "Instructor reviews" },
      { category: "Checkpoint 4 (Final Presentation)", type: "on-going", part: "1", weight: 40, completionCriteria: "5/10", duration: "10'-30'", clo: "CLO5", questionType: "Oral Presentation", noQuestion: "1", knowledgeAndSkill: "Pitch deck, business plan", gradingGuide: "Team profile 10%, Product-market fit 40%, Business model 20%, Operative 20%, Fundraising 10%", note: "Graded by instructor and mentor" },
    ],
    materials: [
      { description: "The Lean Startup", author: "Eric Ries", publisher: "Crown Business", publishedDate: "2011", edition: "1st Edition", isbn: "978-0307887894", isMainMaterial: "Main", isHardCopy: "Có", isOnline: "Có", note: "Sách giáo trình chính" },
      { description: "Online material sources (video, documents)", author: "Y Combinator (San Jose, CA)", publisher: "Y Combinator", publishedDate: "2024", edition: "Latest", isbn: "N/A", isMainMaterial: "Reference", isHardCopy: "Không", isOnline: "Có", note: "www.StartupSchool.org" },
      { description: "How to Design a Better Pitch Deck", author: "Kevin Hale", publisher: "Y Combinator", publishedDate: "2024", edition: "Online", isbn: "N/A", isMainMaterial: "Reference", isHardCopy: "Không", isOnline: "Có", note: "https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck" },
    ],
  },
};

export type DemoDatasetKey = keyof typeof DEMO_DATASETS;
