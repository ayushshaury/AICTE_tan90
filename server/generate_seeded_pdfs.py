import sys
import os
import fitz 

upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'private-uploads'))
os.makedirs(upload_dir, exist_ok=True)

def create_aicte_pdf(filepath, title, header_lines, body_paragraphs, table_data=None):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4

   
    rect = fitz.Rect(30, 25, 565, 95)
    page.draw_rect(rect, color=(0, 0.13, 0.28), fill=(0.95, 0.97, 1.0), width=1.5)

  
    page.insert_text(fitz.Point(45, 50), "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", fontsize=13, fontname="helv", fontfile=None, color=(0, 0.13, 0.28))
    page.insert_text(fitz.Point(45, 68), "(A STATUTORY BODY UNDER MINISTRY OF EDUCATION, GOVT. OF INDIA)", fontsize=8, fontname="helv", color=(0.4, 0.4, 0.4))
    page.insert_text(fitz.Point(45, 84), "Nelson Mandela Marg, Vasant Kunj, New Delhi-110070 | https://aicte-india.org", fontsize=8, fontname="helv", color=(0.2, 0.2, 0.2))

    page.insert_text(fitz.Point(35, 125), title.upper(), fontsize=12, fontname="helv", color=(0.8, 0.2, 0))
    page.draw_line(fitz.Point(35, 132), fitz.Point(560, 132), color=(0.8, 0.2, 0), width=1)

    y = 155
    for k, v in header_lines:
        page.insert_text(fitz.Point(40, y), f"{k}:", fontsize=9.5, fontname="helv", color=(0.1, 0.1, 0.1))
        page.insert_text(fitz.Point(220, y), str(v), fontsize=9.5, fontname="helv", color=(0.0, 0.15, 0.35))
        y += 20

    y += 15
    for p in body_paragraphs:
        rect_text = fitz.Rect(40, y, 555, y + 60)
        page.insert_textbox(rect_text, p, fontsize=9, fontname="helv", color=(0.15, 0.15, 0.15))
        y += 50

    if table_data:
        y += 10
       
        cols = [40, 100, 320, 420, 520]
        header_row = ["Sr.", "Programme / Course", "Level", "Intake", "Status"]
        page.draw_rect(fitz.Rect(40, y, 555, y + 22), color=(0, 0.13, 0.28), fill=(0, 0.13, 0.28))
        for idx, col_name in enumerate(header_row):
            page.insert_text(fitz.Point(cols[idx] + 5, y + 15), col_name, fontsize=8.5, fontname="helv", color=(1, 1, 1))
        y += 22

        for r_idx, row in enumerate(table_data):
            bg = (0.97, 0.98, 1.0) if r_idx % 2 == 0 else (1.0, 1.0, 1.0)
            page.draw_rect(fitz.Rect(40, y, 555, y + 20), color=(0.8, 0.8, 0.8), fill=bg, width=0.5)
            for c_idx, val in enumerate(row):
                page.insert_text(fitz.Point(cols[c_idx] + 5, y + 14), str(val), fontsize=8, fontname="helv", color=(0.1, 0.1, 0.1))
            y += 20

  
    y_seal = max(y + 35, 710)
    page.draw_rect(fitz.Rect(380, y_seal, 550, y_seal + 80), color=(0.6, 0.6, 0.6), width=1)
    page.insert_text(fitz.Point(390, y_seal + 20), "Digitally Signed & Certified", fontsize=8.5, fontname="helv", color=(0, 0.5, 0.2))
    page.insert_text(fitz.Point(390, y_seal + 38), "Member Secretary / Authorized Officer", fontsize=8, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text(fitz.Point(390, y_seal + 54), "AICTE Western Regional Office", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))
    page.insert_text(fitz.Point(390, y_seal + 70), "Date: Certified Electronic Docket", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))


    page.draw_line(fitz.Point(30, 805), fitz.Point(565, 805), color=(0.8, 0.8, 0.8), width=0.5)
    page.insert_text(fitz.Point(40, 820), "AICTE VerifyAI Regulatory Audit Docket — AICTE Approval Process Handbook (APH 2026-27)", fontsize=7, fontname="helv", color=(0.5, 0.5, 0.5))
    page.insert_text(fitz.Point(480, 820), "Page 1 of 1", fontsize=7, fontname="helv", color=(0.5, 0.5, 0.5))

    doc.save(filepath)
    doc.close()
    print(f"Generated PDF: {filepath}")

create_aicte_pdf(
    os.path.join(upload_dir, "synthetic_apex_eoa_order_2025.pdf"),
    "Extension of Approval (EoA) Order — Academic Year 2025-2026",
    [
        ("Application Reference Number", "AICTE/2025-26/1-9876543"),
        ("Approved Institution", "Apex Institute of Technology & Management"),
        ("Institution Permanent ID", "1-10023456 / AICTE-DEMO-101"),
        ("Campus Physical Address", "Plot 42, Knowledge Park III, Pune, Maharashtra 411001"),
        ("Affiliating University", "Savitribai Phule Pune University (SPPU)"),
        ("Approval Academic Session", "2025-2026"),
        ("Total Approved Intake", "360 Seats (Three Hundred Sixty)"),
        ("Issuing Regional Directorate", "Western Regional Office (WRO), Mumbai"),
    ],
    [
        "In terms of the provisions under the All India Council for Technical Education (Grant of Approvals for Technical Institutions) Regulations, Extension of Approval (EoA) was granted for the academic year 2025-26 subject to strict adherence to norms prescribed by AICTE.",
        "The institution shall maintain appropriate faculty-to-student cadre ratios, laboratory floor areas, library collections, and fire safety compliance in accordance with the AICTE Approval Process Handbook."
    ],
    [
        ["1", "Computer Science & Engineering", "Under Graduate", "120", "Approved"],
        ["2", "Electronics & Communication Engg", "Under Graduate", "60", "Approved"],
        ["3", "Mechanical Engineering", "Under Graduate", "60", "Approved"],
        ["4", "Information Technology", "Under Graduate", "120", "Approved"]
    ]
)

create_aicte_pdf(
    os.path.join(upload_dir, "synthetic_apex_fire_safety.pdf"),
    "Fire Safety Compliance Certificate & No Objection Certificate (NOC)",
    [
        ("Certificate Number", "PMC/FB/NOC/2025/481"),
        ("Issuing Department", "Chief Fire Officer, Pune Municipal Corporation Fire Brigade"),
        ("Certified Premises", "Apex Institute of Technology & Management, Plot 42, Knowledge Park III"),
        ("Total Plot & Built-up Area", "7.5 Acres (Campus Land Area) / 18,500 sq.m Built-up"),
        ("Date of Inspection", "10/05/2024"),
        ("Date of Issue", "16/05/2024"),
        ("Certificate Validity Window", "16/05/2024 to 15/05/2025 (EXPIRED)"),
        ("Compliance Remark", "Fire alarm systems, wet risers, hose reels inspected on site."),
    ],
    [
        "This certificate is issued pursuant to Maharashtra Fire Prevention and Life Safety Measures Act. The premises were evaluated for external access roads, staircases, emergency fire exits, and automated smoke detection.",
        "NOTICE: The validity period for this certificate ended on 15/05/2025. An authorized renewal inspection is mandated by regulatory authorities prior to granting annual operational approval for the subsequent cycle."
    ]
)


create_aicte_pdf(
    os.path.join(upload_dir, "synthetic_apex_eoa_2025.pdf"),
    "Official Extension of Approval Order — Academic Year 2025-26 (Copy)",
    [
        ("Letter Reference", "AICTE/WRO/2025-26/1-9876543-EOA"),
        ("Institution Name", "Apex Institute of Technology & Management"),
        ("Sponsoring Society", "Apex Technical Education Society, Pune"),
        ("Approved Total Seats", "360 Seats"),
        ("Validity Period", "Academic Session 2025-2026"),
    ],
    [
        "Copy of record from the Council national repository confirming approved technical engineering programs for academic session 2025-26."
    ],
    [
        ["1", "Computer Science & Engineering", "UG Degree", "120", "Sanctioned"],
        ["2", "Electronics & Communication Engg", "UG Degree", "60", "Sanctioned"],
        ["3", "Mechanical Engineering", "UG Degree", "60", "Sanctioned"],
        ["4", "Information Technology", "UG Degree", "120", "Sanctioned"]
    ]
)

create_aicte_pdf(
    os.path.join(upload_dir, "synthetic_saraswati_affidavit.pdf"),
    "AICTE Undertaking & Regulatory Affidavit — Session 2026-27",
    [
        ("Institution Legal Title", "Saraswati Vidyapeeth College of Engineering"),
        ("Institution Permanent ID", "AICTE-DEMO-102"),
        ("Campus Address", "Survey No. 88, Electronic City Phase 1, Bengaluru 560100"),
        ("Deponent / Principal", "Dr. Sunita Deshmukh, Principal"),
        ("Stamp Paper Serial Number", "KA-STAMP-2026-44910"),
    ],
    [
        "I hereby solemnly declare and affirm that the institution has complied with all mandatory student admission guidelines, fee fixation regulatory directives, and anti-ragging measures."
    ]
)

create_aicte_pdf(
    os.path.join(upload_dir, "synthetic_saraswati_land_noc.pdf"),
    "Land Title, Possession & Municipal NOC Certificate",
    [
        ("Issuing Authority", "Karnataka Industrial Areas Development Board (KIADB)"),
        ("Allottee Institution", "Saraswati Vidyapeeth College of Engineering"),
        ("Survey / Plot Number", "Plot 88-B, Electronic City Industrial Phase 1"),
        ("Total Land Area Allocated", "5.2 Acres (Freehold Ownership)"),
        ("Certificate Number", "KIADB/ALLOT/BLR/2021/984"),
    ],
    [
        "This certificate confirms unencumbered, perpetual title ownership in the name of the sponsoring trust for conducting technical degree education."
    ]
)

print("All seeded PDFs created successfully!")
