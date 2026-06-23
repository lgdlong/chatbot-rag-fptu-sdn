# User Flows

> Phiên bản: 1.0  
> Cập nhật: 2026-06-23

## Student

```mermaid
flowchart TD
    A["Login"] --> B["Student Search"]
    B --> C["Student Subject Detail"]
    C --> D["Course Chat Panel"]
    D --> E["History"]
```

## Lecturer

```mermaid
flowchart TD
    A["Login"] --> B["Lecturer Syllabus List"]
    B --> C["Create Syllabus"]
    B --> D["Edit Syllabus"]
    B --> E["Lecturer Syllabus Detail"]
    D --> F["Document Manager"]
    E --> G["Course Chat Panel"]
```

## Super Admin

```mermaid
flowchart TD
    A["Login"] --> B["Lecturer Management"]
    A --> C["Student Whitelist Management"]
```

## Notes

- `STUDENT` chỉ chat từ syllabus public `approved + active`
- `LECTURER` chat từ `Lecturer Syllabus Detail` của syllabus đang chọn
- `Document Manager` chỉ cho `PDF`; snapshot syllabus do hệ thống tự sinh
- Không có flow `lecturer request`
