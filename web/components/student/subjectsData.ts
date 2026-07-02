export interface Subject {
  code: string;
  name: string;
  credits: number;
  decision: string;
  isActive: boolean;
  isApproved: boolean;
  syllabusId: string;
  syllabusName: string;
  department: string;
  color: string;
}

export const ALL_SUBJECTS: Subject[] = [
  {
    code: "FER202",
    name: "Front-End web development with React",
    credits: 3,
    decision: "359/QĐ-ĐHFPT dated 04/09/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12580",
    syllabusName: "Front-End web development with React_Phát triển web Front-End với React",
    department: "Software Engineering",
    color: "#3b82f6",
  },
  {
    code: "PRN232",
    name: "Building Cross-Platform Back-End Application With .NET",
    credits: 3,
    decision: "202/QĐ-ĐHFPT dated 10/12/2025",
    isActive: false,
    isApproved: false,
    syllabusId: "12581",
    syllabusName: "Building Cross-Platform Back-End Application With .NET_Xây dựng ứng dụng Back-End với .NET",
    department: "Software Engineering",
    color: "#8b5cf6",
  },
  {
    code: "SDN302",
    name: "Server-Side development with NodeJS",
    credits: 3,
    decision: "412/QĐ-ĐHFPT dated 15/06/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12582",
    syllabusName: "Server-Side development with NodeJS_Phát triển phía Server với NodeJS",
    department: "Software Engineering",
    color: "#10b981",
  },
  {
    code: "PRN212",
    name: "Basic Cross-Platform App Programming With .NET",
    credits: 3,
    decision: "321/QĐ-ĐHFPT dated 12/03/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12583",
    syllabusName: "Basic Cross-Platform App Programming With .NET_Lập trình ứng dụng đa nền tảng cơ bản với .NET",
    department: "Software Engineering",
    color: "#8b5cf6",
  },
  {
    code: "SWE201c",
    name: "Introduction to Software Engineering",
    credits: 3,
    decision: "155/QĐ-ĐHFPT dated 22/01/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12584",
    syllabusName: "Introduction to Software Engineering_Nhập môn Kỹ nghệ phần mềm",
    department: "Software Engineering",
    color: "#f59e0b",
  },
  {
    code: "SWD392",
    name: "Software Architecture and Design",
    credits: 3,
    decision: "201/QĐ-ĐHFPT dated 18/02/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12585",
    syllabusName: "Software Architecture and Design_Thiết kế và Kiến trúc phần mềm",
    department: "Software Engineering",
    color: "#ef4444",
  },
  {
    code: "MAD101",
    name: "Discrete Mathematics",
    credits: 3,
    decision: "112/QĐ-ĐHFPT dated 14/01/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12586",
    syllabusName: "Discrete Mathematics_Toán học rời rạc",
    department: "Basic Sciences",
    color: "#10b981",
  },
];
