# Traceability Matrix

> Phiên bản: 1.0  
> Cập nhật: 2026-06-23

| Actor | Story | FR | Screen |
|---|---|---|---|
| `STUDENT` | US-ST-01 | FR-01.1, FR-01.2 | `Login` |
| `STUDENT` | US-ST-02 | FR-02.1, FR-02.2 | `Student Search` |
| `STUDENT` | US-ST-03 | FR-02.3, FR-02.4 | `Student Subject Detail` |
| `STUDENT` | US-ST-04, US-ST-05, US-ST-06 | FR-05.1, FR-05.2, FR-05.3, FR-05.4, FR-05.5 | `Course Chat Panel` |
| `STUDENT` | US-ST-07 | FR-05.6 | `Course Chat Panel` |
| `LECTURER` | US-LE-01 | FR-01.3 | `Login` |
| `LECTURER` | US-LE-02 | FR-03.1, FR-03.2 | `Lecturer Syllabus List`, `Create Syllabus` |
| `LECTURER` | US-LE-03, US-LE-09 | FR-03.3, FR-03.7 | `Edit Syllabus` |
| `LECTURER` | US-LE-04 | FR-03.4 | `Edit Syllabus` |
| `LECTURER` | US-LE-05 | FR-03.5, FR-03.6 | `Edit Syllabus` |
| `LECTURER` | US-LE-05A | FR-03.9 | `Lecturer Syllabus Detail` |
| `LECTURER` | US-LE-06, US-LE-07, US-LE-08 | FR-04.1, FR-04.2, FR-04.3, FR-04.4, FR-04.5, FR-04.6 | `Document Manager` |
| `LECTURER` | US-LE-10 | FR-05.1, FR-05.2, FR-05.3, FR-05.4, FR-05.5, FR-05.9 | `Course Chat Panel` |
| `SUPER_ADMIN` | US-SA-01, US-SA-02, US-SA-03 | FR-06.1, FR-06.2, FR-06.3 | `Lecturer Management` |
| `SUPER_ADMIN` | US-SA-04, US-SA-05 | FR-06.4, FR-06.5, FR-06.6 | `Student Whitelist Management` |

## Quyết định cắt scope

| Chủ đề | Chốt |
|---|---|
| Lecturer onboarding | Manual create bởi `SUPER_ADMIN` |
| RAG engine | `AnythingLLM` |
| Upload release A | `PDF only` |
| Syllabus trong RAG | `Snapshot markdown` sinh từ DB |
| Video | Không thuộc core |
| Chat | `1 selected syllabus/workspace only` |
