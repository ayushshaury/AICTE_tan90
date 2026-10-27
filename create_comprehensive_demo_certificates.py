import os
import fitz

def build_demo_certificate(
    output_paths,
    title,
    doc_type_badge,
    is_anomaly,
    anomaly_title,
    anomaly_detail,
    metadata_rows,
    body_paragraphs,
    table_headers=None,
    table_rows=None,
    tampered_cell=None, # (row_idx, col_idx, expected_val)
    expired_date=None,
    seal_color=(0, 0.45, 0.2), # green by default, red/amber if anomaly
    status_stamp="VERIFIED AUTHENTIC"
):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4 format

    # Background tint
    if is_anomaly:
        page.draw_rect(fitz.Rect(0, 0, 595, 842), color=None, fill=(0.99, 0.98, 0.98))
    else:
        page.draw_rect(fitz.Rect(0, 0, 595, 842), color=None, fill=(0.99, 0.99, 1.0))

    # Top Gov/AICTE Header Banner
    header_rect = fitz.Rect(25, 20, 570, 95)
    page.draw_rect(header_rect, color=(0, 0.13, 0.28), fill=(0.96, 0.97, 1.0), width=1.8)

    # Tricolor bar at top of header
    page.draw_rect(fitz.Rect(25, 20, 206, 24), color=None, fill=(1.0, 0.6, 0.2)) # Saffron
    page.draw_rect(fitz.Rect(206, 20, 388, 24), color=None, fill=(1.0, 1.0, 1.0)) # White
    page.draw_rect(fitz.Rect(388, 20, 570, 24), color=None, fill=(0.07, 0.53, 0.03)) # Green

    page.insert_text(fitz.Point(40, 48), "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", fontsize=12.5, fontname="helv", color=(0, 0.13, 0.28))
    page.insert_text(fitz.Point(40, 64), "(A STATUTORY BODY UNDER MINISTRY OF EDUCATION, GOVERNMENT OF INDIA)", fontsize=8, fontname="helv", color=(0.35, 0.35, 0.35))
    page.insert_text(fitz.Point(40, 80), "Nelson Mandela Marg, Vasant Kunj, New Delhi-110070 | Verification Portal: https://aicte-india.org", fontsize=7.5, fontname="helv", color=(0.2, 0.2, 0.2))

    # Doc Classification Badge
    badge_rect = fitz.Rect(420, 35, 555, 58)
    badge_bg = (0.9, 0.2, 0.2) if is_anomaly else (0.05, 0.35, 0.15)
    page.draw_rect(badge_rect, color=badge_bg, fill=badge_bg)
    badge_text = "ANOMALY TEST" if is_anomaly else "VALID DOCKET"
    page.insert_text(fitz.Point(432, 50), badge_text, fontsize=9, fontname="helv", color=(1, 1, 1))

    # Certificate Title
    page.insert_text(fitz.Point(30, 122), title.upper(), fontsize=11.5, fontname="helv", color=(0.85, 0.2, 0.0))
    page.draw_line(fitz.Point(30, 128), fitz.Point(565, 128), color=(0.85, 0.2, 0.0), width=1.2)

    # Anomaly Warning Banner on Document if anomalous
    curr_y = 145
    if is_anomaly:
        warn_rect = fitz.Rect(30, curr_y, 565, curr_y + 44)
        page.draw_rect(warn_rect, color=(0.9, 0.2, 0.2), fill=(1.0, 0.94, 0.94), width=1.5)
        page.insert_text(fitz.Point(45, curr_y + 18), f"FLAGGED IRREGULARITY: {anomaly_title}", fontsize=9, fontname="helv", color=(0.8, 0, 0))
        page.insert_text(fitz.Point(45, curr_y + 34), anomaly_detail, fontsize=7.8, fontname="helv", color=(0.3, 0.1, 0.1))
        curr_y += 58

    # Metadata Grid
    for k, v in metadata_rows:
        page.insert_text(fitz.Point(35, curr_y), f"{k}:", fontsize=9, fontname="helv", color=(0.15, 0.15, 0.15))
        val_color = (0.8, 0, 0) if (expired_date and expired_date in str(v)) else (0.0, 0.15, 0.4)
        page.insert_text(fitz.Point(210, curr_y), str(v), fontsize=9, fontname="helv", color=val_color)
        curr_y += 18

    curr_y += 10
    # Body Paragraphs
    for p in body_paragraphs:
        rect_text = fitz.Rect(35, curr_y, 560, curr_y + 48)
        page.insert_textbox(rect_text, p, fontsize=8.5, fontname="helv", color=(0.2, 0.2, 0.2))
        curr_y += 42

    # Optional Table (e.g. Course Intake Breakdown)
    if table_headers and table_rows:
        curr_y += 10
        cols = [35, 80, 290, 390, 480, 565]
        page.draw_rect(fitz.Rect(35, curr_y, 565, curr_y + 20), color=(0, 0.13, 0.28), fill=(0, 0.13, 0.28))
        for idx, h in enumerate(table_headers):
            page.insert_text(fitz.Point(cols[idx] + 5, curr_y + 14), h, fontsize=8, fontname="helv", color=(1, 1, 1))
        curr_y += 20

        for r_idx, row in enumerate(table_rows):
            is_tampered_row = tampered_cell and tampered_cell[0] == r_idx
            bg_color = (1.0, 0.9, 0.9) if is_tampered_row else ((0.97, 0.98, 1.0) if r_idx % 2 == 0 else (1.0, 1.0, 1.0))
            page.draw_rect(fitz.Rect(35, curr_y, 565, curr_y + 19), color=(0.8, 0.8, 0.8), fill=bg_color, width=0.5)

            for c_idx, val in enumerate(row):
                is_tampered_cell = is_tampered_row and tampered_cell[1] == c_idx
                txt_color = (0.85, 0, 0) if is_tampered_cell else (0.1, 0.1, 0.1)
                page.insert_text(fitz.Point(cols[c_idx] + 5, curr_y + 13), str(val), fontsize=8, fontname="helv", color=txt_color)

                # Draw bounding reticle around tampered value
                if is_tampered_cell:
                    box_rect = fitz.Rect(cols[c_idx] + 2, curr_y + 1, cols[c_idx + 1] - 2, curr_y + 17)
                    page.draw_rect(box_rect, color=(0.9, 0.1, 0.1), width=1.5)
            curr_y += 19

        if tampered_cell:
            curr_y += 8
            page.insert_text(fitz.Point(40, curr_y), f"* NOTE: Baseline Approved Intake was {tampered_cell[2]} seats. Unsanctioned variation detected in current claim.", fontsize=7.5, fontname="helv", color=(0.8, 0, 0))
            curr_y += 12

    # Official Seal & Electronic Signature Stamp
    stamp_y = max(curr_y + 25, 690)
    seal_rect = fitz.Rect(360, stamp_y, 565, stamp_y + 85)
    page.draw_rect(seal_rect, color=seal_color, width=1.5)

    status_color = (0.85, 0.1, 0.1) if is_anomaly else (0.05, 0.5, 0.2)
    page.insert_text(fitz.Point(375, stamp_y + 22), f"SECURITY STATUS: {status_stamp}", fontsize=8.5, fontname="helv", color=status_color)
    page.insert_text(fitz.Point(375, stamp_y + 40), "Authorized Regulatory Officer / Scrutiny Committee", fontsize=7.5, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text(fitz.Point(375, stamp_y + 56), "AICTE National Scrutiny Portal (Govt. of India)", fontsize=7, fontname="helv", color=(0.4, 0.4, 0.4))
    page.insert_text(fitz.Point(375, stamp_y + 72), "Digital Docket Fingerprint: SHA256-AUTHENTICATED", fontsize=6.8, fontname="helv", color=(0.4, 0.4, 0.4))

    # Watermark Stamp
    watermark_rect = fitz.Rect(45, stamp_y + 10, 220, stamp_y + 75)
    page.draw_rect(watermark_rect, color=(0.8, 0.8, 0.8), fill=(0.97, 0.97, 0.97), width=0.8)
    page.insert_text(fitz.Point(55, stamp_y + 32), "AICTE OFFICIAL EMBLEM", fontsize=8, fontname="helv", color=(0.5, 0.5, 0.5))
    page.insert_text(fitz.Point(55, stamp_y + 50), "DEMO SCRUTINY SPECIMEN", fontsize=7.5, fontname="helv", color=(0.6, 0.6, 0.6))
    page.insert_text(fitz.Point(55, stamp_y + 65), "FOR HACKATHON EVALUATION", fontsize=6.8, fontname="helv", color=(0.7, 0.7, 0.7))

    # Footer
    page.draw_line(fitz.Point(25, 805), fitz.Point(570, 805), color=(0.8, 0.8, 0.8), width=0.5)
    page.insert_text(fitz.Point(30, 820), "AICTE 90* Verification Assistant — Synthetic Regulatory Demo Fixture (Smart India Hackathon 2026)", fontsize=7, fontname="helv", color=(0.4, 0.4, 0.4))
    page.insert_text(fitz.Point(500, 820), "Page 1 of 1", fontsize=7, fontname="helv", color=(0.4, 0.4, 0.4))

    # Save to all required destination paths
    for p in output_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        doc.save(p)
    doc.close()
    print(f"Created certificate: {output_paths[0]}")

def generate_all_certificates():
    base_dirs = [
        os.path.abspath("demo-certificates"),
        os.path.abspath("backend/private-uploads"),
        os.path.abspath("frontend/public/demo-certificates")
    ]

    def get_paths(filename):
        return [os.path.join(d, filename) for d in base_dirs]

    # =========================================================================
    # 1. VALID AICTE Extension of Approval 2025-26
    # =========================================================================
    build_demo_certificate(
        get_paths("01_VALID_AICTE_EoA_Order_2025-26.pdf"),
        title="Official Extension of Approval (EoA) Order — AY 2025-26",
        doc_type_badge="VALID_EOA",
        is_anomaly=False,
        anomaly_title="",
        anomaly_detail="",
        metadata_rows=[
            ("Application Reference", "AICTE/WRO/2025-26/1-9876543-EOA"),
            ("Institution Legal Name", "Apex Institute of Technology & Management"),
            ("Institution Code", "AICTE-DEMO-101 / PID: 1-10023456"),
            ("Campus Address", "Plot 42, Knowledge Park III, Pune, Maharashtra 411001"),
            ("Approval Academic Cycle", "2025-2026"),
            ("Total Approved Intake", "360 Seats (Full-time Engineering)"),
            ("Affiliating University", "Savitribai Phule Pune University (SPPU)"),
        ],
        body_paragraphs=[
            "In terms of statutory powers conferred under Section 10(k) of the AICTE Act 1987, the All India Council for Technical Education hereby conveys Extension of Approval (EoA) to Apex Institute of Technology & Management for the academic cycle 2025-26.",
            "The approval is subject to mandatory compliance with AICTE cadre ratios, laboratory equipment, and structural safety standards."
        ],
        table_headers=["Sr.", "Course / Programme", "Level", "Approved Intake", "Status"],
        table_rows=[
            ["1", "Computer Science & Engineering", "Under Graduate", "120", "APPROVED"],
            ["2", "Electronics & Communication Engg", "Under Graduate", "60", "APPROVED"],
            ["3", "Mechanical Engineering", "Under Graduate", "60", "APPROVED"],
            ["4", "Information Technology", "Under Graduate", "120", "APPROVED"],
        ],
        status_stamp="VERIFIED & VALID"
    )

    # =========================================================================
    # 2. VALID Building Structural Stability Certificate
    # =========================================================================
    build_demo_certificate(
        get_paths("02_VALID_Building_Structural_Safety_Certificate.pdf"),
        title="Building Structural Stability & Seismic Compliance Certificate",
        doc_type_badge="STRUCTURAL_STABILITY",
        is_anomaly=False,
        anomaly_title="",
        anomaly_detail="",
        metadata_rows=[
            ("Certificate Reference", "MUNICIPAL/STR-CERT/2024/771"),
            ("Institution Certified", "Apex Institute of Technology & Management"),
            ("Structural Engineering Consultant", "Dr. A. K. Banerjee, Chartered Structural Engineer (MIE-9941)"),
            ("Date of On-site Inspection", "12/03/2024"),
            ("Certificate Validity Period", "15/03/2024 to 14/03/2029 (5 Years Validity)"),
            ("Seismic Zone Rating", "Zone III Compliant — National Building Code 2016"),
        ],
        body_paragraphs=[
            "This is to certify that the institutional RCC multi-storey educational building blocks (Academic Blocks A, B, C and Administrative Block) were inspected in accordance with IS 456:2000 and IS 1893:2016.",
            "The structural members, shear walls, foundation piers, and fire escape staircases are safe, structurally sound, and certified fit for technical education occupancy."
        ],
        status_stamp="AUTHENTIC CIVIL CERTIFICATE"
    )

    # =========================================================================
    # 3. VALID Land Ownership & Possession Deed
    # =========================================================================
    build_demo_certificate(
        get_paths("03_VALID_Land_Title_Ownership_NOC.pdf"),
        title="Industrial Land Possession & Unencumbered Title Certificate",
        doc_type_badge="LAND_NOC",
        is_anomaly=False,
        anomaly_title="",
        anomaly_detail="",
        metadata_rows=[
            ("Sanction Letter No.", "MIDC/IND-LAND/PUN/2018/1042"),
            ("Allottee Educational Society", "Apex Technical Education Society, Pune"),
            ("Campus Name", "Apex Institute of Technology & Management"),
            ("Allocated Land Area", "7.50 Acres (Continuous & Contiguous Freehold Land)"),
            ("Survey / Sector Number", "Plot 42, Knowledge Park III, Pune"),
            ("Land Use Classification", "Institutional Technical Education — Unencumbered"),
        ],
        body_paragraphs=[
            "Certified that the land parcel admeasuring 7.50 Acres is in lawful, undisputed freehold possession of the applicant society for establishment of technical engineering programs.",
            "The title deeds are registered in the sub-registrar office under Book 1, Volume 412, Page 88."
        ],
        status_stamp="VERIFIED LAND TITLE"
    )

    # =========================================================================
    # 4. VALID Mandatory Notarized Regulatory Affidavit
    # =========================================================================
    build_demo_certificate(
        get_paths("04_VALID_Mandatory_Affidavit_Notarized.pdf"),
        title="Sworn Undertaking & Mandatory Regulatory Affidavit (AY 2026-27)",
        doc_type_badge="AFFIDAVIT",
        is_anomaly=False,
        anomaly_title="",
        anomaly_detail="",
        metadata_rows=[
            ("Stamp Paper Serial Number", "MH-STAMP-2026-9938210"),
            ("Deponent / Principal", "Dr. Arvind Patel, Principal & Professor"),
            ("Representing Institution", "Apex Institute of Technology & Management"),
            ("Notary Public Registration", "Adv. R. K. Joshi, Govt. of Maharashtra Reg. No. 4410"),
            ("Date of Deposition", "14/01/2026"),
            ("AICTE Undertaking Format", "Format 1 — AICTE Approval Process Handbook (APH 2026-27)"),
        ],
        body_paragraphs=[
            "I, Dr. Arvind Patel, solemnly affirm that all details submitted in the AICTE application are true, accurate, and verifiable from institutional books of record.",
            "I swear that no capitation fee has been levied, anti-ragging measures are fully implemented, and statutory cadre ratios are maintained."
        ],
        status_stamp="NOTARIZED UNDERTAKING"
    )

    # =========================================================================
    # 5. FAKE / TAMPERED INTAKE EoA Letter (ANOMALY)
    # =========================================================================
    build_demo_certificate(
        get_paths("05_FAKE_TAMPERED_INTAKE_EoA_Letter.pdf"),
        title="Extension of Approval Letter AY 2025-26 (ALTERED INTAKE CLAIM)",
        doc_type_badge="TAMPERED_INTAKE",
        is_anomaly=True,
        anomaly_title="UNSANCTIONED INTAKE MODIFICATION DETECTED",
        anomaly_detail="Computer Science & Engineering intake is modified to 180 seats (approved baseline is 120 seats). Discrepancy flagged: +60 unapproved seats without council sanction order.",
        metadata_rows=[
            ("Application Reference", "AICTE/WRO/2025-26/1-9876543-EOA (FORGED COPY)"),
            ("Institution Legal Name", "Apex Institute of Technology & Management"),
            ("Claimed Total Intake", "420 Seats [ALERT: 60 Seats in excess of council approval]"),
            ("Official AICTE Record", "360 Seats Approved (Council Database Record)"),
            ("Scrutiny Finding Code", "RULE_EOA_INTAKE_MISMATCH"),
        ],
        body_paragraphs=[
            "NOTICE OF AUDIT FLAG: The table below contains an unverified modification in row 1. While the preceding year statutory order approved 120 seats for CSE, this document asserts 180 seats.",
            "AICTE Heuristic Cross-Verification flagged this figure against the national repository order hash."
        ],
        table_headers=["Sr.", "Course / Programme", "Level", "Intake Claimed", "Audit State"],
        table_rows=[
            ["1", "Computer Science & Engineering", "UG Degree", "180*", "UNSANCTIONED (+60)"],
            ["2", "Electronics & Communication Engg", "UG Degree", "60", "CONSISTENT"],
            ["3", "Mechanical Engineering", "UG Degree", "60", "CONSISTENT"],
            ["4", "Information Technology", "UG Degree", "120", "CONSISTENT"],
        ],
        tampered_cell=(0, 3, "120"),
        seal_color=(0.85, 0.15, 0.1),
        status_stamp="ANOMALY DETECTED // REVIEW"
    )

    # =========================================================================
    # 6. FAKE / EXPIRED Fire Safety NOC (ANOMALY)
    # =========================================================================
    build_demo_certificate(
        get_paths("06_FAKE_EXPIRED_Fire_Safety_NOC.pdf"),
        title="Fire Safety & Operational Clearance NOC (EXPIRED CERTIFICATE)",
        doc_type_badge="EXPIRED_FIRE_NOC",
        is_anomaly=True,
        anomaly_title="STATUTORY CERTIFICATE EXPIRED BEFORE SCRUTINY PERIOD",
        anomaly_detail="Certificate expired on 15/05/2025. Mandatory valid fire NOC is absent for AY 2026-27 scrutiny cycle. Potential safety jeopardy under APH Chapter II.",
        metadata_rows=[
            ("Certificate Number", "PMC/FIRE/NOC/2024/481"),
            ("Issuing Department", "Chief Fire Officer, Pune Municipal Corporation Fire Brigade"),
            ("Certified Premises", "Apex Institute of Technology & Management"),
            ("Date of Issue", "16/05/2024"),
            ("Expiry Date (Lapsed)", "15/05/2025 (EXPIRED BY 530+ DAYS)"),
            ("Regulatory Rule Code", "RULE_DOC_EXPIRY_CHECK"),
        ],
        body_paragraphs=[
            "REGULATORY WARNING: This NOC has expired. AICTE Approval Process Handbook (APH 2026-27) mandates that all technical institutions possess an unexpired Fire Safety Clearance issued by the competent municipal authority.",
            "The applicant has not uploaded a subsequent annual renewal receipt. Scrutiny officer intervention required."
        ],
        expired_date="15/05/2025",
        seal_color=(0.9, 0.1, 0.1),
        status_stamp="EXPIRED REGULATORY NOC"
    )

    # =========================================================================
    # 7. FAKE / ENTITY NAME INCONSISTENCY Certificate (ANOMALY)
    # =========================================================================
    build_demo_certificate(
        get_paths("07_FAKE_INSTITUTION_NAME_Land_Deed.pdf"),
        title="Institutional Land Allotment Deed (ENTITY TITLE MISMATCH)",
        doc_type_badge="NAME_INCONSISTENCY",
        is_anomaly=True,
        anomaly_title="LEGAL ENTITY NAME DISCREPANCY DETECTED",
        anomaly_detail="Document is issued to 'Apex Educational Academy' rather than the approved registered title 'Apex Institute of Technology & Management'. No legal change of society order attached.",
        metadata_rows=[
            ("Document Extracted Title", "Apex Educational Academy [DISCREPANCY]"),
            ("AICTE Registered Name", "Apex Institute of Technology & Management"),
            ("Discrepancy Severity", "HIGH // POTENTIAL ENTITY TITLE FRAUD"),
            ("Document Type", "Land & Site Possession Certificate"),
            ("Regulatory Rule Code", "RULE_NAME_CONSISTENCY"),
        ],
        body_paragraphs=[
            "COMPLIANCE ALERT: The institution name extracted via OCR from this land conveyance deed does not match the official AICTE portal registration name.",
            "In accordance with AICTE APH regulations, approvals cannot be issued if title deed ownership resides in the name of an unauthorized third-party entity."
        ],
        seal_color=(0.85, 0.2, 0.1),
        status_stamp="ENTITY MISMATCH FLAGGED"
    )

    # =========================================================================
    # 8. FAKE / DUPLICATE FILE HASH Certificate (ANOMALY)
    # =========================================================================
    build_demo_certificate(
        get_paths("08_FAKE_DUPLICATE_FILE_COLLISION.pdf"),
        title="Statutory Clearance Docket (DUPLICATE FILE RE-UPLOAD)",
        doc_type_badge="DUPLICATE_SHA256",
        is_anomaly=True,
        anomaly_title="EXACT DUPLICATE FILE CONTENT DETECTED",
        anomaly_detail="SHA-256 cryptographic checksum of this upload is identical to a certificate uploaded under another statutory category. Flagged as re-used dummy document.",
        metadata_rows=[
            ("Detected SHA-256 Checksum", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
            ("Original File Uploaded As", "Building_Stability_Certificate.pdf"),
            ("Re-uploaded As", "Faculty_Cadre_Endorsement_List.pdf"),
            ("Regulatory Rule Code", "RULE_DUPLICATE_FILE_HASH"),
        ],
        body_paragraphs=[
            "CRYPTOGRAPHIC INTEGRITY ALERT: The cryptographic hash of this file matches an existing file in the application docket. The applicant has submitted duplicate content in lieu of mandatory faculty cadre documentation.",
            "Automated detection flagged exact duplicate byte payload."
        ],
        seal_color=(0.85, 0.2, 0.1),
        status_stamp="DUPLICATE PAYLOAD FLAGGED"
    )

    print("\n[SUCCESS] Generated 8 Demo Certificates in demo-certificates/, backend/private-uploads/, and frontend/public/demo-certificates/!")

if __name__ == '__main__':
    generate_all_certificates()
