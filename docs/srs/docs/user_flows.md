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
    D --> E["Document Manager"]
```

## Super Admin

```mermaid
flowchart TD
    A["Login"] --> B["Lecturer Management"]
    A --> C["Student Whitelist Management"]
```

## Notes

- Chat chỉ đi từ `Student Subject Detail`
- `Document Manager` chỉ cho `PDF`
- Không có flow `lecturer request`
