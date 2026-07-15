"""
THE CONCEPT WARRIORS — Complete Project Documentation PDF
Uses ReportLab Platypus for professional multi-page layout
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
import datetime

# ── BRAND COLOURS ────────────────────────────────────────────
C_PRIMARY    = HexColor('#4F46E5')
C_PURPLE     = HexColor('#7C3AED')
C_ACCENT     = HexColor('#F59E0B')
C_SUCCESS    = HexColor('#10B981')
C_DANGER     = HexColor('#EF4444')
C_DARK       = HexColor('#0F172A')
C_TEXT       = HexColor('#1E293B')
C_MUTED      = HexColor('#64748B')
C_LIGHT      = HexColor('#F1F5F9')
C_BORDER     = HexColor('#E2E8F0')
C_WHITE      = HexColor('#FFFFFF')
C_BG_BLUE    = HexColor('#EEF2FF')
C_PHYSICS    = HexColor('#3B82F6')
C_CHEMISTRY  = HexColor('#10B981')
C_MATHS      = HexColor('#F59E0B')
C_HEADING_BG = HexColor('#1E1B4B')

W, H = A4  # 595.28 x 841.89 points

# ── PAGE TEMPLATE WITH HEADER/FOOTER ─────────────────────────
class DocCanvas:
    def __init__(self, doc_title="The Concept Warriors — Project Documentation"):
        self.doc_title = doc_title

    def __call__(self, canv, doc):
        canv.saveState()
        # Header bar
        canv.setFillColor(C_HEADING_BG)
        canv.rect(0, H - 36, W, 36, fill=1, stroke=0)
        canv.setFillColor(C_WHITE)
        canv.setFont("Helvetica-Bold", 9)
        canv.drawString(20, H - 22, "⚡  THE CONCEPT WARRIORS")
        canv.setFont("Helvetica", 8)
        canv.setFillColor(HexColor('#A5B4FC'))
        canv.drawRightString(W - 20, H - 22, self.doc_title)

        # Footer bar
        canv.setFillColor(C_LIGHT)
        canv.rect(0, 0, W, 28, fill=1, stroke=0)
        canv.setStrokeColor(C_BORDER)
        canv.setLineWidth(0.5)
        canv.line(0, 28, W, 28)
        canv.setFillColor(C_MUTED)
        canv.setFont("Helvetica", 7.5)
        canv.drawString(20, 10, "Confidential — The Concept Warriors, Sandeep Kumar © 2025")
        canv.drawRightString(W - 20, 10, f"Page {doc.page}")
        canv.restoreState()


# ── COLOUR BLOCK FLOWABLE ─────────────────────────────────────
class ColorBlock(Flowable):
    """Full-width coloured box with white text heading."""
    def __init__(self, text, bg=C_PRIMARY, fg=C_WHITE, font_size=13, height=34):
        super().__init__()
        self.text = text
        self.bg = bg
        self.fg = fg
        self.font_size = font_size
        self._height = height
        self.width = W - 80  # margins

    def draw(self):
        self.canv.setFillColor(self.bg)
        self.canv.roundRect(0, 0, self.width, self._height, 6, fill=1, stroke=0)
        self.canv.setFillColor(self.fg)
        self.canv.setFont("Helvetica-Bold", self.font_size)
        self.canv.drawString(14, (self._height - self.font_size) / 2 + 2, self.text)

    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        return availWidth, self._height


class SectionDivider(Flowable):
    """A thin gradient-ish divider line."""
    def __init__(self):
        super().__init__()

    def draw(self):
        self.canv.setStrokeColor(C_PRIMARY)
        self.canv.setLineWidth(2)
        self.canv.line(0, 0, 80, 0)
        self.canv.setStrokeColor(C_BORDER)
        self.canv.setLineWidth(0.5)
        self.canv.line(80, 0, self.width, 0)

    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        return availWidth, 4


# ── STYLE DEFINITIONS ─────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles['cover_brand'] = ParagraphStyle('cover_brand',
        fontName='Helvetica-Bold', fontSize=11, textColor=HexColor('#A5B4FC'),
        letterSpacing=3, alignment=TA_CENTER, spaceBefore=0, spaceAfter=4)

    styles['cover_title'] = ParagraphStyle('cover_title',
        fontName='Helvetica-Bold', fontSize=32, textColor=C_WHITE,
        leading=40, alignment=TA_CENTER, spaceBefore=8, spaceAfter=8)

    styles['cover_subtitle'] = ParagraphStyle('cover_subtitle',
        fontName='Helvetica', fontSize=13, textColor=HexColor('#CBD5E1'),
        alignment=TA_CENTER, spaceBefore=0, spaceAfter=20)

    styles['cover_meta'] = ParagraphStyle('cover_meta',
        fontName='Helvetica', fontSize=10, textColor=HexColor('#94A3B8'),
        alignment=TA_CENTER, spaceBefore=4, spaceAfter=4)

    styles['ch_number'] = ParagraphStyle('ch_number',
        fontName='Helvetica-Bold', fontSize=9, textColor=C_PRIMARY,
        spaceBefore=28, spaceAfter=2)

    styles['ch_title'] = ParagraphStyle('ch_title',
        fontName='Helvetica-Bold', fontSize=20, textColor=C_DARK,
        leading=26, spaceBefore=0, spaceAfter=6)

    styles['ch_intro'] = ParagraphStyle('ch_intro',
        fontName='Helvetica', fontSize=10.5, textColor=C_MUTED,
        leading=16, spaceBefore=0, spaceAfter=16)

    styles['h2'] = ParagraphStyle('h2',
        fontName='Helvetica-Bold', fontSize=13, textColor=C_PRIMARY,
        spaceBefore=18, spaceAfter=6)

    styles['h3'] = ParagraphStyle('h3',
        fontName='Helvetica-Bold', fontSize=11, textColor=C_DARK,
        spaceBefore=12, spaceAfter=4)

    styles['body'] = ParagraphStyle('body',
        fontName='Helvetica', fontSize=10, textColor=C_TEXT,
        leading=15.5, spaceBefore=0, spaceAfter=8, alignment=TA_JUSTIFY)

    styles['bullet'] = ParagraphStyle('bullet',
        fontName='Helvetica', fontSize=10, textColor=C_TEXT,
        leading=15, spaceBefore=0, spaceAfter=4,
        leftIndent=14, firstLineIndent=-14)

    styles['bullet_bold'] = ParagraphStyle('bullet_bold',
        fontName='Helvetica-Bold', fontSize=10, textColor=C_PRIMARY,
        leading=15, spaceBefore=2, spaceAfter=2,
        leftIndent=14, firstLineIndent=-14)

    styles['note'] = ParagraphStyle('note',
        fontName='Helvetica-Oblique', fontSize=9, textColor=C_MUTED,
        leading=14, spaceBefore=4, spaceAfter=4,
        leftIndent=10, borderPad=6)

    styles['code'] = ParagraphStyle('code',
        fontName='Courier', fontSize=8.5, textColor=HexColor('#312E81'),
        leading=13, spaceBefore=4, spaceAfter=4,
        leftIndent=10, backColor=C_BG_BLUE)

    styles['toc_entry'] = ParagraphStyle('toc_entry',
        fontName='Helvetica', fontSize=10.5, textColor=C_TEXT,
        leading=18, spaceBefore=2, spaceAfter=2)

    styles['toc_chapter'] = ParagraphStyle('toc_chapter',
        fontName='Helvetica-Bold', fontSize=11, textColor=C_PRIMARY,
        leading=20, spaceBefore=8, spaceAfter=0)

    return styles


# ── TABLE HELPER ─────────────────────────────────────────────
def make_table(data, col_widths, header_bg=C_PRIMARY):
    t = Table(data, colWidths=col_widths)
    style = TableStyle([
        # Header row
        ('BACKGROUND',  (0, 0), (-1, 0), header_bg),
        ('TEXTCOLOR',   (0, 0), (-1, 0), C_WHITE),
        ('FONTNAME',    (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING',  (0, 0), (-1, 0), 8),
        # Body rows
        ('FONTNAME',    (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE',    (0, 1), (-1, -1), 9),
        ('TOPPADDING',  (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_LIGHT]),
        ('TEXTCOLOR',   (0, 1), (-1, -1), C_TEXT),
        ('GRID',        (0, 0), (-1, -1), 0.4, C_BORDER),
        ('VALIGN',      (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 9),
        ('RIGHTPADDING', (0, 0), (-1, -1), 9),
    ])
    t.setStyle(style)
    return t


def info_box(elements, title, items, styles, bg=C_BG_BLUE, border=C_PRIMARY):
    """Render a coloured info box as a table."""
    rows = [[Paragraph(f'<b>{title}</b>', ParagraphStyle('ibh',
             fontName='Helvetica-Bold', fontSize=10, textColor=border))]]
    for item in items:
        rows.append([Paragraph(f'• {item}', styles['bullet'])])
    t = Table(rows, colWidths=[W - 80])
    t.setStyle(TableStyle([
        ('BACKGROUND',  (0, 0), (-1, 0), bg),
        ('BACKGROUND',  (0, 1), (-1, -1), HexColor('#FAFBFF')),
        ('BOX',         (0, 0), (-1, -1), 1.5, border),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING',  (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING',  (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#FAFBFF')]),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 10))


# ════════════════════════════════════════════════════════════
#  COVER PAGE
# ════════════════════════════════════════════════════════════
def cover_page(elements, styles):
    # Top background strip (simulated via table)
    cover_data = [['']]
    cover_table = Table(cover_data, colWidths=[W - 80], rowHeights=[260])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_HEADING_BG),
        ('ROUNDEDCORNERS', [8]),
    ]))

    elements.append(Spacer(1, 20))

    # Blue hero block
    hero = Table([
        [Paragraph('PROJECT DOCUMENTATION', styles['cover_brand'])],
        [Paragraph('The Concept Warriors', styles['cover_title'])],
        [Paragraph('Complete Web Platform — Design, Architecture & Development Report', styles['cover_subtitle'])],
        [Paragraph(' ', styles['cover_meta'])],
        [Paragraph('Tutor: Sandeep Kumar, M.Sc. Chemistry  |  Punjab, India', styles['cover_meta'])],
        [Paragraph(f'Document Date: {datetime.date.today().strftime("%d %B %Y")}', styles['cover_meta'])],
        [Paragraph('Version 1.0  |  Prepared by: Development Team', styles['cover_meta'])],
    ], colWidths=[W - 80])
    hero.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), C_HEADING_BG),
        ('TOPPADDING',    (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING',   (0, 0), (-1, -1), 20),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 20),
        ('ROUNDEDCORNERS', [10]),
    ]))
    elements.append(hero)
    elements.append(Spacer(1, 24))

    # Summary stat boxes
    stat_data = [[
        Table([[Paragraph('<b>13</b>', ParagraphStyle('sv', fontName='Helvetica-Bold', fontSize=22,
                textColor=C_PRIMARY, alignment=TA_CENTER))],
               [Paragraph('Files Delivered', ParagraphStyle('sl', fontName='Helvetica', fontSize=9,
                textColor=C_MUTED, alignment=TA_CENTER))]],
               colWidths=[100]),
        Table([[Paragraph('<b>10</b>', ParagraphStyle('sv', fontName='Helvetica-Bold', fontSize=22,
                textColor=C_SUCCESS, alignment=TA_CENTER))],
               [Paragraph('Pages / Sections', ParagraphStyle('sl', fontName='Helvetica', fontSize=9,
                textColor=C_MUTED, alignment=TA_CENTER))]],
               colWidths=[100]),
        Table([[Paragraph('<b>3</b>', ParagraphStyle('sv', fontName='Helvetica-Bold', fontSize=22,
                textColor=C_ACCENT, alignment=TA_CENTER))],
               [Paragraph('Subjects Covered', ParagraphStyle('sl', fontName='Helvetica', fontSize=9,
                textColor=C_MUTED, alignment=TA_CENTER))]],
               colWidths=[100]),
        Table([[Paragraph('<b>Full</b>', ParagraphStyle('sv', fontName='Helvetica-Bold', fontSize=22,
                textColor=C_DANGER, alignment=TA_CENTER))],
               [Paragraph('Stack Delivered', ParagraphStyle('sl', fontName='Helvetica', fontSize=9,
                textColor=C_MUTED, alignment=TA_CENTER))]],
               colWidths=[100]),
    ]]
    stat_table = Table(stat_data, colWidths=[118, 118, 118, 118])
    stat_table.setStyle(TableStyle([
        ('BOX',           (0, 0), (-1, -1), 1, C_BORDER),
        ('INNERGRID',     (0, 0), (-1, -1), 0.5, C_BORDER),
        ('BACKGROUND',    (0, 0), (-1, -1), C_WHITE),
        ('TOPPADDING',    (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('ROUNDEDCORNERS', [8]),
    ]))
    elements.append(stat_table)
    elements.append(Spacer(1, 24))

    # Quick identifier strip
    id_data = [['Client / Tutor', 'Sandeep Kumar, M.Sc. Chemistry'],
               ['Brand',          'The Concept Warriors'],
               ['Contact',        '+91 8427168892  |  sandeep@conceptwarriors.in'],
               ['Location',       'Punjab, India  (Online Classes — Pan-India)'],
               ['Project Type',   'Full EdTech Website + LMS + Admin Dashboard + Backend API'],
               ['Tech Stack',     'HTML5 / CSS3 / Vanilla JS  +  Node.js / Express / SQLite'],
               ['Document Type',  'Project Requirement, Design Decisions & Delivery Report']]

    id_table = Table(id_data, colWidths=[140, W - 80 - 140])
    id_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (0, -1), C_LIGHT),
        ('FONTNAME',      (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE',      (0, 0), (-1, -1), 9),
        ('TEXTCOLOR',     (0, 0), (0, -1), C_PRIMARY),
        ('TEXTCOLOR',     (1, 0), (1, -1), C_TEXT),
        ('GRID',          (0, 0), (-1, -1), 0.4, C_BORDER),
        ('TOPPADDING',    (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 10),
    ]))
    elements.append(id_table)
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  TABLE OF CONTENTS
# ════════════════════════════════════════════════════════════
def table_of_contents(elements, styles):
    elements.append(ColorBlock('TABLE OF CONTENTS', C_HEADING_BG))
    elements.append(Spacer(1, 18))

    toc = [
        ('01', 'Project Overview & Client Brief', '3'),
        ('02', 'Client Requirements Analysis', '4'),
        ('03', 'Our Design Thinking & Approach', '5'),
        ('04', 'Information Architecture & Sitemap', '6'),
        ('05', 'UI/UX Design Decisions', '7'),
        ('06', 'Page-by-Page Breakdown', '8'),
        ('07', 'Features & Functionality', '10'),
        ('08', 'Technology Stack', '11'),
        ('09', 'Backend Architecture', '12'),
        ('10', 'Database Schema', '13'),
        ('11', 'File Structure & Deliverables', '14'),
        ('12', 'Security & Performance', '15'),
        ('13', 'Deployment Guide', '16'),
        ('14', 'Credentials Reference', '17'),
        ('15', 'Future Enhancements', '18'),
    ]

    toc_data = []
    for num, title, pg in toc:
        toc_data.append([
            Paragraph(f'<b>{num}</b>', ParagraphStyle('tn', fontName='Helvetica-Bold',
                      fontSize=10, textColor=C_PRIMARY)),
            Paragraph(title, styles['toc_entry']),
            Paragraph(pg, ParagraphStyle('tp', fontName='Helvetica', fontSize=10,
                      textColor=C_MUTED, alignment=TA_RIGHT)),
        ])

    t = Table(toc_data, colWidths=[30, W - 80 - 30 - 30, 30])
    t.setStyle(TableStyle([
        ('FONTSIZE',      (0, 0), (-1, -1), 10),
        ('TOPPADDING',    (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('LINEBELOW',     (0, 0), (-1, -1), 0.3, C_BORDER),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [C_WHITE, C_LIGHT]),
    ]))
    elements.append(t)
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 1 — PROJECT OVERVIEW & CLIENT BRIEF
# ════════════════════════════════════════════════════════════
def ch1_overview(elements, styles):
    elements.append(Paragraph('CHAPTER 01', styles['ch_number']))
    elements.append(Paragraph('Project Overview & Client Brief', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        'This chapter presents the original client brief, the background of the project, '
        'the tutor\'s profile, and the high-level vision that guided every decision made '
        'during design and development.', styles['ch_intro']))

    elements.append(Paragraph('1.1  Who Is the Client?', styles['h2']))
    elements.append(Paragraph(
        'The client is <b>Sandeep Kumar</b>, a highly experienced educator based in '
        'Punjab, India. He holds an <b>M.Sc. in Chemistry</b> and has over <b>10 years '
        'of teaching and mentoring experience</b>, having personally guided 500+ students '
        'across Class 8–12 and competitive examinations including NEET, JEE, and CUET.',
        styles['body']))
    elements.append(Paragraph(
        'Sandeep Sir operates under the brand name <b>"The Concept Warriors"</b> — '
        'a name that captures his teaching philosophy: equipping students with such deep '
        'conceptual understanding that they become warriors capable of conquering any exam.',
        styles['body']))

    elements.append(Paragraph('1.2  The Starting Point', styles['h2']))
    elements.append(Paragraph(
        'The client came with a promotional poster (WhatsApp marketing image) for his '
        'personal home tutoring service. The poster advertised:', styles['body']))

    info_box(elements, 'What the Poster Showed:', [
        'Brand: "Personal Home Tutoring" — One-to-One Online Tutoring',
        'Tutor: Sandeep Kumar, M.Sc. Chemistry, 10+ Years Experience',
        'Subjects: Physics, Chemistry, Mathematics',
        'Target Students: Class 8th to 12th and Competitive Exam students',
        'Contact: WhatsApp 8427168892',
        'Tagline: Better Concepts. Better Confidence. Better Future!',
        'Key Features: Concept Clarity, Problem Solving, Short Tricks, Doubt Solving, Regular Tests',
    ], styles, C_BG_BLUE, C_PRIMARY)

    elements.append(Paragraph('1.3  The Client\'s Vision', styles['h2']))
    elements.append(Paragraph(
        'Beyond the poster, the client expressed a comprehensive vision for a complete '
        'digital presence. The instruction was clear and ambitious:', styles['body']))

    quote_data = [[Paragraph(
        '"Build a complete production-ready tutoring website for the educational brand '
        'The Concept Warriors. The website must feel premium, trustworthy, modern, and '
        'highly conversion-focused. A student should immediately feel impressed and '
        'motivated to enroll."',
        ParagraphStyle('quote', fontName='Helvetica-Oblique', fontSize=11,
                       textColor=C_PRIMARY, leading=18, leftIndent=10))]]
    qt = Table(quote_data, colWidths=[W - 80])
    qt.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), C_BG_BLUE),
        ('LEFTPADDING',   (0, 0), (-1, -1), 18),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 18),
        ('TOPPADDING',    (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('LINEBEFORE',    (0, 0), (0, -1), 4, C_PRIMARY),
        ('ROUNDEDCORNERS', [6]),
    ]))
    elements.append(qt)
    elements.append(Spacer(1, 12))

    elements.append(Paragraph('1.4  Services the Client Offers', styles['h2']))
    services = [
        'Online Classes (Live & Recorded)', 'Offline / In-Person Classes',
        'Personal Home Tutoring', 'One-to-One Tutoring',
        'Mentorship Programs', 'Academic Guidance',
        'School Board Preparation (CBSE & State)', 'NEET Preparation',
        'JEE Main & Advanced Preparation', 'CUET Preparation',
        'Doubt Solving Sessions', 'Recorded Lectures',
        'Handwritten Notes & E-Resources', 'Industrial Mentorship',
        'Exam Strategy Sessions', 'Concept Building Programs',
    ]
    rows = []
    for i in range(0, len(services), 2):
        left = services[i]
        right = services[i+1] if i+1 < len(services) else ''
        rows.append([
            Paragraph(f'✓  {left}', styles['bullet']),
            Paragraph(f'✓  {right}' if right else '', styles['bullet']),
        ])
    svc_table = Table(rows, colWidths=[(W-80)/2, (W-80)/2])
    svc_table.setStyle(TableStyle([
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('BACKGROUND',    (0, 0), (-1, -1), C_WHITE),
        ('LINEBELOW',     (0, 0), (-1, -1), 0.3, C_BORDER),
    ]))
    elements.append(svc_table)
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 2 — REQUIREMENTS ANALYSIS
# ════════════════════════════════════════════════════════════
def ch2_requirements(elements, styles):
    elements.append(Paragraph('CHAPTER 02', styles['ch_number']))
    elements.append(Paragraph('Client Requirements Analysis', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        'A detailed breakdown of every requirement the client specified, categorized '
        'by type to guide the architecture and feature planning process.',
        styles['ch_intro']))

    elements.append(Paragraph('2.1  Pages Required', styles['h2']))
    pages_data = [
        ['#', 'Page', 'Purpose', 'Priority'],
        ['1', 'Home Page (index.html)', 'Primary landing — hero, subjects, stats, CTA', 'Critical'],
        ['2', 'About Tutor Page', 'Sandeep Kumar bio, timeline, achievements', 'High'],
        ['3', 'Courses & Programs', 'All course cards with filter, benefits, CTA', 'High'],
        ['4', 'Mentorship Page', 'Mentorship types, roadmap, enrollment', 'High'],
        ['5', 'Exam Preparation', 'NEET / JEE / CUET / Boards — tabs & roadmaps', 'High'],
        ['6', 'Contact Page', 'Three forms: callback, demo, enrollment', 'Critical'],
        ['7', 'LMS Login Page', 'Student authentication portal', 'High'],
        ['8', 'Student Dashboard', 'Lectures, notes, tests, progress, schedule', 'High'],
        ['9', 'Admin Login Page', 'Restricted admin authentication', 'High'],
        ['10', 'Admin Dashboard', 'Full CRM — enquiries, students, courses, data', 'High'],
    ]
    elements.append(make_table(pages_data,
        [20, 140, 230, 72], C_PRIMARY))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('2.2  Design Requirements', styles['h2']))
    design_reqs = [
        'Glassmorphism effects — frosted glass cards, blurred backgrounds',
        'Modern gradient backgrounds with animated floating elements (orbs)',
        'Scroll-triggered animations using AOS library',
        'Mouse interaction / tilt effects on cards',
        '3D card effects with perspective transforms',
        'Animated counters for statistics (students, years, classes)',
        'Interactive hover states on all interactive elements',
        'Smooth page transitions and smooth scrolling',
        'Premium CTAs — high-converting button design',
        'Floating educational shape decorations (atom, flask, pi, sigma)',
        'Parallax-style background depth effects',
        'Mobile-first responsive design for all screen sizes',
        'Light and Dark theme with localStorage persistence',
        'Premium typography using Space Grotesk + Inter fonts',
    ]
    for r in design_reqs:
        elements.append(Paragraph(f'→  {r}', styles['bullet']))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph('2.3  Functional Requirements', styles['h2']))
    func_data = [
        ['Feature', 'Description', 'Status'],
        ['Contact Forms', '3 forms: Callback, Demo, Enrollment with validation', 'Delivered'],
        ['WhatsApp Button', 'Floating button, pre-filled message, auto-opens WA', 'Delivered'],
        ['AI Chatbot', 'Frontend chatbot — answers FAQs, course info, enrollment', 'Delivered'],
        ['Popups', 'Welcome, Demo, Enroll, Success — custom, no browser alert()', 'Delivered'],
        ['FAQ Accordion', 'Animated, 15+ FAQs, smooth open/close', 'Delivered'],
        ['Testimonials', 'Carousel with auto-scroll, dots, prev/next navigation', 'Delivered'],
        ['LMS Dashboard', 'Lectures, notes, assignments, tests, schedule, profile', 'Delivered'],
        ['Admin Dashboard', 'CRM tables, status updates, CSV export, student mgmt', 'Delivered'],
        ['Theme Toggle', 'Light/dark with moon/sun icon, localStorage memory', 'Delivered'],
        ['Animated Counters', 'Intersection-observer triggered number animations', 'Delivered'],
        ['Course Filter', 'Filter courses by category — competitive/school/etc.', 'Delivered'],
        ['SEO Tags', 'Meta, Open Graph, structured JSON-LD data', 'Delivered'],
        ['Backend API', 'Node.js + Express + SQLite REST API', 'Delivered'],
        ['Email Alerts', 'Nodemailer — admin email on every form submission', 'Delivered'],
    ]
    elements.append(make_table(func_data, [110, 245, 66], C_SUCCESS))
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 3 — DESIGN THINKING
# ════════════════════════════════════════════════════════════
def ch3_design_thinking(elements, styles):
    elements.append(Paragraph('CHAPTER 03', styles['ch_number']))
    elements.append(Paragraph('Our Design Thinking & Approach', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        'Before writing a single line of code, we thought deeply about the user journey, '
        'conversion psychology, and what makes a premium EdTech platform feel different '
        'from a typical coaching institute website.', styles['ch_intro']))

    elements.append(Paragraph('3.1  The Problem We Were Solving', styles['h2']))
    elements.append(Paragraph(
        'Most tutoring websites in India look dated — plain Bootstrap layouts, stock '
        'photos of textbooks, and contact forms that lead nowhere. The client already '
        'had real results and genuine credibility. The website needed to <b>match his '
        'actual quality</b>, not undermine it.', styles['body']))
    elements.append(Paragraph(
        'Our design challenge: create a site that instantly communicates trust, expertise, '
        'and premium quality — within the first 5 seconds a student lands on it.',
        styles['body']))

    elements.append(Paragraph('3.2  Target Audience Analysis', styles['h2']))
    audience_data = [
        ['Audience', 'What They Need', 'How We Addressed It'],
        ['Student (16–19 yrs)', 'Modern feel, relatable, motivating',
         'Bold hero, floating cards, dark mode option, mobile-first'],
        ['Parent', 'Trust, credibility, contact ease',
         'Tutor bio, 10+ yr badge, WhatsApp CTA everywhere'],
        ['NEET / JEE Aspirant', 'Specific exam guidance, proof of results',
         'Dedicated exam prep page, roadmaps, mock test mentions'],
        ['Dropper Student', 'Confidence rebuilding, specialized help',
         'Dedicated dropper batch course card, empathetic copy'],
    ]
    elements.append(make_table(audience_data, [90, 160, 172], C_PURPLE))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('3.3  Conversion Funnel We Designed', styles['h2']))
    elements.append(Paragraph(
        'Every page and section was placed with a deliberate conversion goal in mind:',
        styles['body']))

    funnel = [
        ('Awareness', 'Hero Section', 'Strong headline + visual + badge → "Something premium here"'),
        ('Interest', 'Why Choose / Subjects', 'Concept-first differentiation → "This is different"'),
        ('Desire', 'Stats + Testimonials', 'Social proof → "Others are succeeding here"'),
        ('Action', 'CTA Sections + Popups', 'Free demo friction-removed → "I want to try this"'),
        ('Retention', 'LMS Dashboard', 'Enrolled students get value → "I\'ll refer my friends"'),
    ]
    f_data = [['Stage', 'Section', 'Psychology Goal']] + [[a,b,c] for a,b,c in funnel]
    elements.append(make_table(f_data, [65, 100, 257], C_ACCENT))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('3.4  Design Principles Applied', styles['h2']))
    principles = [
        ('Visual Hierarchy', 'Large gradient headline → supporting text → CTA button. Eye flow is intentional.'),
        ('White Space', 'Generous padding around sections so content breathes and reads easily.'),
        ('Colour Psychology', 'Indigo/purple = trust & intelligence. Amber = energy & action. Green = success.'),
        ('Glassmorphism', 'Semi-transparent cards with backdrop blur create depth without heaviness.'),
        ('Motion as Feedback', 'Every hover, scroll, and click has visual feedback — buttons lift, cards tilt.'),
        ('Mobile-First', 'All layouts designed for 375px first, then enhanced for tablet and desktop.'),
        ('Consistency', 'Single CSS variable system ensures colors, spacing, and radius are uniform.'),
    ]
    for name, desc in principles:
        elements.append(Paragraph(f'<b>■  {name}</b>', styles['h3']))
        elements.append(Paragraph(desc, styles['body']))

    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 4 — INFORMATION ARCHITECTURE
# ════════════════════════════════════════════════════════════
def ch4_architecture(elements, styles):
    elements.append(Paragraph('CHAPTER 04', styles['ch_number']))
    elements.append(Paragraph('Information Architecture & Sitemap', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        'How content is organized across pages, the navigation structure, '
        'and why each piece of information lives where it does.',
        styles['ch_intro']))

    elements.append(Paragraph('4.1  Site Structure', styles['h2']))
    site_data = [
        ['Zone', 'Pages', 'Navigation Level'],
        ['Public Marketing', 'Home, About, Courses, Mentorship, Exam Prep, Contact', 'Primary Nav'],
        ['Student Portal', 'LMS Login, Student Dashboard', 'Secondary Nav (LMS button)'],
        ['Admin Zone', 'Admin Login, Admin Dashboard', 'Footer link only'],
        ['API Layer', '/api/* endpoints (backend)', 'Internal — not navigable'],
    ]
    elements.append(make_table(site_data, [100, 240, 82], C_PRIMARY))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('4.2  Home Page Section Order (Why This Order)', styles['h2']))
    home_sections = [
        ('1', 'Navigation Bar', 'Always visible — anchors all pages, theme toggle, free demo CTA'),
        ('2', 'Hero Section', 'First impression — headline, stats, floating tutor card'),
        ('3', 'Trust Bar', 'Immediately after hero — 6 trust signals reinforce the hero claim'),
        ('4', 'Why Choose Us', 'Answers the "why this tutor?" question before the student asks it'),
        ('5', 'Subjects Section', 'Shows scope — Physics, Chemistry, Maths with topics'),
        ('6', 'Teaching Modes', 'Removes objections — online/offline/home/1-on-1 all shown'),
        ('7', 'Stats Counter', 'Dark contrast section — animated numbers build social proof'),
        ('8', 'Exam Prep Preview', '4 exam cards — positions as competitive exam specialist'),
        ('9', 'Testimonials', 'Student + parent voices — highest trust signal on page'),
        ('10', 'FAQ', 'Removes last hesitations before conversion'),
        ('11', 'Final CTA', 'One last, high-energy push to book demo or WhatsApp'),
        ('12', 'Footer', 'Links, contact, legal, admin access'),
    ]
    hs_data = [['#', 'Section', 'Strategic Purpose']] + home_sections
    elements.append(make_table(hs_data, [20, 120, 282], C_DARK))
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 5 — UI/UX DECISIONS
# ════════════════════════════════════════════════════════════
def ch5_uiux(elements, styles):
    elements.append(Paragraph('CHAPTER 05', styles['ch_number']))
    elements.append(Paragraph('UI/UX Design Decisions', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        'Every visual and interaction decision had a reason. This chapter explains '
        'the key choices made and the thinking behind them.', styles['ch_intro']))

    elements.append(Paragraph('5.1  Colour System', styles['h2']))
    colour_data = [
        ['Token', 'Value', 'Used For'],
        ['--primary', '#4F46E5  (Indigo)', 'Buttons, links, active states, icon accents'],
        ['--purple', '#7C3AED  (Purple)', 'Gradients, hero backgrounds, premium feel'],
        ['--accent', '#F59E0B  (Amber)', 'CTAs, highlights, star ratings, exam badges'],
        ['--success', '#10B981  (Emerald)', 'Chemistry colour, success states, enrolled badges'],
        ['--physics', '#3B82F6  (Blue)', 'Physics subject colour, JEE badge'],
        ['--maths', '#F59E0B  (Amber)', 'Mathematics subject colour'],
        ['--danger', '#EF4444  (Red)', 'NEET badge, admin alerts, delete actions'],
        ['--bg', '#FAFAFA (light) / #0B0F1A (dark)', 'Page background — theme-aware'],
        ['--surface', '#FFFFFF (light) / #1E2536 (dark)', 'Card surfaces — theme-aware'],
    ]
    elements.append(make_table(colour_data, [80, 130, 212], C_DARK))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('5.2  Typography Choices', styles['h2']))
    typo_data = [
        ['Font', 'Role', 'Reason'],
        ['Space Grotesk', 'Display / Headings', 'Modern, geometric, premium — reads powerfully at large sizes'],
        ['Inter', 'Body / UI Text', 'Highly legible at small sizes, trusted by top SaaS products'],
        ['Font Awesome 6.5', 'Icons', 'Complete set covering all educational and UI icon needs'],
    ]
    elements.append(make_table(typo_data, [100, 120, 202], C_PURPLE))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('5.3  Component Design Decisions', styles['h2']))
    components = [
        ('Hero Floating Cards', 'Three absolutely-positioned cards (NEET Ready, Live+Recorded, Doubt Sessions) create a layered depth effect without needing real images.'),
        ('Subject Cards', 'Full gradient background cards (blue for Physics, green for Chemistry, amber for Maths) with white text — instantly color-coded by subject.'),
        ('Stats Section', 'Dark indigo background creates contrast break in the page flow — the bright gradient numbers pop dramatically against it.'),
        ('Testimonial Carousel', 'Auto-scrolling carousel with manual controls. Dot indicators. 3 cards visible on desktop, 1 on mobile. Smooth CSS transform animations.'),
        ('FAQ Accordion', 'max-height: 0 → 200px CSS transition instead of display:none/block — enables smooth animated expand/collapse without JS height calculations.'),
        ('Popups', 'backdrop-filter: blur() + rgba overlay — modern popup with glassmorphism. CSS transform scale animation on open. No browser alert() ever used.'),
        ('Chatbot Widget', 'Fixed-position floating widget. Pattern-matching keyword detection routes to relevant response. Quick reply buttons for the most common questions.'),
        ('WhatsApp Float', 'Pulsing box-shadow animation draws attention subtly. Tooltip on hover. Pre-filled message removes friction from first contact.'),
    ]
    for name, desc in components:
        elements.append(Paragraph(f'<b>◆  {name}</b>', styles['h3']))
        elements.append(Paragraph(desc, styles['body']))

    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 6 — PAGE-BY-PAGE BREAKDOWN
# ════════════════════════════════════════════════════════════
def ch6_pages(elements, styles):
    elements.append(Paragraph('CHAPTER 06', styles['ch_number']))
    elements.append(Paragraph('Page-by-Page Breakdown', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))

    pages = [
        {
            'file': 'index.html — Home Page',
            'color': C_PRIMARY,
            'sections': [
                'Hero: Animated headline, floating tutor card stack, subject tags, star rating, 3 animated stat counters',
                'Trust Bar: 6 horizontal trust signals (concept clarity, 1-on-1, flexible timing, notes, recorded, tracking)',
                'Why Choose: 6 glass cards with hover lift — each addressing a student concern',
                'Subjects: 3 gradient cards (Physics=blue, Chemistry=green, Maths=amber) with topic lists',
                'Teaching Modes: 4 numbered cards — Online, Offline, Home Tutoring, One-to-One',
                'Stats Counter: Dark section — 500+ students, 10+ years, 5000+ classes, 98% success',
                'Exam Preview: 4 exam cards with NEET/JEE/CUET/Boards colour coding and feature lists',
                'Testimonials: 5-card auto-scrolling carousel with student + parent reviews and star ratings',
                'FAQ: 15 animated accordion items covering all common pre-enrollment questions',
                'CTA: Dark gradient section with two buttons — free demo + WhatsApp',
                'Popups: Welcome (2.5s delay), Demo, Enroll, Success — all custom, all animated',
                'Chatbot: AI-style floating widget with keyword detection and quick reply buttons',
            ]
        },
        {
            'file': 'about.html — About Tutor',
            'color': C_PURPLE,
            'sections': [
                'Hero: Two-column — left: headline + CTAs, right: profile card with stats and social links',
                'Teaching Philosophy: "Why Concept Warriors?" — 3 principle cards with icons',
                'Journey Timeline: 5 milestone timeline (2010→present) with animated dot indicators',
                'Skills Section: 6 animated skill bars with % completion for each expertise area',
                'Achievements: 6 achievement cards — students, NEET qualifiers, JEE percentile, classes, rating, reach',
            ]
        },
        {
            'file': 'courses.html — Courses & Programs',
            'color': C_SUCCESS,
            'sections': [
                'Filter System: 5 category buttons (All, Competitive, School, Foundation, Mentorship)',
                '9 Course Cards: NEET, JEE, CUET, Board Prep, Foundation, Crash Course, Concept Building, Mentorship, Dropper',
                'Each Card: Header gradient, level badge, meta (duration, subjects, mode), description, 5 outcomes, 2 CTAs',
                'Teaching Modes Banner: 4 mode cards — Online Live, Offline, Home Tutoring, One-to-One',
            ]
        },
        {
            'file': 'mentorship.html — Mentorship',
            'color': C_ACCENT,
            'sections': [
                '6 Mentorship Cards: Academic Roadmap, Career Guidance, Study Habits, Emotional Support, Industrial, Tracking',
                '6-Step Journey Roadmap: Free consultation → diagnostic → plan → sessions → tests → exam day',
            ]
        },
        {
            'file': 'exam-prep.html — Exam Preparation',
            'color': C_DANGER,
            'sections': [
                'Tab System: NEET / JEE / CUET / Boards — URL hash routing (#neet, #jee, etc.)',
                'Each Tab: Exam badge, headline, description, key stats (score/questions/duration), bullet advantages',
                '4-Phase Roadmap Card: Month-by-month preparation phases for each exam',
                'Pro Tip Quote Box: Colour-coded insight from Sandeep Sir for each exam',
                'Features Strip: Handwritten notes, recorded lectures, mock tests, WhatsApp doubt solving',
            ]
        },
        {
            'file': 'contact.html — Contact',
            'color': C_PHYSICS,
            'sections': [
                'Contact Info Card: WhatsApp (fastest), Email, Location with icons',
                'Form 1 — Callback Request: Name, Phone, Email, Time Slot preference',
                'Form 2 — Demo Class: Name, Phone, Email, Class, Target Exam',
                'Form 3 — Enrollment: Name, Phone, Email, Course, Mode, Message',
                'All forms: POST to /api/* backend endpoints with localStorage fallback',
            ]
        },
        {
            'file': 'lms-login.html — Student Login',
            'color': HexColor('#1E1B4B'),
            'sections': [
                'Split layout: Left panel (brand features list), Right panel (login form)',
                'Dark theme always active on this page — cinematic feel',
                'Demo credentials displayed in info box for testing',
                'Auth: Validates against hardcoded + localStorage credentials, redirects to dashboard',
            ]
        },
        {
            'file': 'lms-dashboard.html — Student Dashboard',
            'color': C_SUCCESS,
            'sections': [
                'Sidebar Navigation: 9 sections — Dashboard, Lectures, Notes, Assignments, Tests, Downloads, Progress, Schedule, Announcements, Profile',
                'Dashboard: Greeting, 4 stat cards, recent lectures, announcements, upcoming classes',
                'Recorded Lectures: Filterable by subject, grouped by chapter, play button per lecture',
                'Notes & Materials: 6 downloadable note cards with PDF download buttons',
                'Assignments: Pending + Completed lists with status badges and WhatsApp submission link',
                'Tests & Results: 5 past results with scores, batch rank, next mock test info',
                'Downloads: Resource library — PDFs, PPTs, question papers with download buttons',
                'Progress: Syllabus completion bars (Physics 68%, Chemistry 75%, Maths 55%), performance metrics, weak area tags',
                'Schedule: 5 upcoming classes with date badges and join links',
                'Profile: Student details, enrollment info, quick action buttons',
            ]
        },
    ]

    for page in pages:
        elements.append(ColorBlock(f'  {page["file"]}', page["color"], font_size=10, height=30))
        elements.append(Spacer(1, 8))
        for sec in page['sections']:
            elements.append(Paragraph(f'•  {sec}', styles['bullet']))
        elements.append(Spacer(1, 10))

    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 7 — FEATURES & FUNCTIONALITY
# ════════════════════════════════════════════════════════════
def ch7_features(elements, styles):
    elements.append(Paragraph('CHAPTER 07', styles['ch_number']))
    elements.append(Paragraph('Features & Functionality', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))

    features_data = [
        ['Feature', 'Implementation', 'Location'],
        ['Dark / Light Theme', 'CSS data-theme attribute + localStorage', 'All pages'],
        ['Animated Counters', 'IntersectionObserver + setInterval increment', 'Home, About'],
        ['AOS Scroll Animations', 'AOS.js CDN library, fade/zoom/flip triggers', 'All pages'],
        ['Card Tilt Effect', 'mousemove → rotateX/Y via inline transform', 'Course, Why cards'],
        ['Testimonial Carousel', 'CSS translateX + JS index tracking + auto-timer', 'Home'],
        ['FAQ Accordion', 'max-height CSS transition + .active class toggle', 'Home'],
        ['Welcome Popup', '2500ms setTimeout on page load', 'Home only'],
        ['Demo/Enroll Popups', 'openPopup() / closePopup() with body overflow lock', 'All pages'],
        ['Success Popup', 'Shown after any successful form submission', 'All pages'],
        ['WhatsApp Float', 'Fixed position + pulse animation + pre-filled URL', 'All pages'],
        ['Chatbot Widget', 'Keyword matching → pre-written responses dictionary', 'All pages'],
        ['Course Filter', 'data-category attribute + display:none/flex toggle', 'Courses page'],
        ['Exam Tab System', 'URL hash routing + .active class switching', 'Exam Prep'],
        ['Lecture Filter', 'data-subject attribute + display:block/none toggle', 'LMS Dashboard'],
        ['LMS Auth', 'localStorage cw-lms-logged + redirect guard', 'LMS pages'],
        ['Admin Auth', 'localStorage cw-admin-logged + X-Admin-Token header', 'Admin pages'],
        ['Backend API', 'Express.js REST endpoints + SQLite storage', 'server.js'],
        ['Email Alerts', 'Nodemailer + Gmail SMTP on form submission', 'Backend'],
        ['Rate Limiting', 'express-rate-limit — 20 requests/15 min on forms', 'Backend'],
        ['CSV Export', 'Blob API + anchor download in admin JS', 'Admin Dashboard'],
        ['Data Persistence', 'SQLite file-based DB via @libsql/client', 'Backend'],
        ['SEO', 'Meta, OG tags, JSON-LD structured data', 'All HTML files'],
        ['Back to Top', 'Scroll event → opacity toggle + smooth scroll', 'All pages'],
        ['Hamburger Menu', 'Toggle .open class on nav-links div', 'Mobile nav'],
    ]
    elements.append(make_table(features_data, [130, 175, 117], C_DARK))
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 8 — TECHNOLOGY STACK
# ════════════════════════════════════════════════════════════
def ch8_tech(elements, styles):
    elements.append(Paragraph('CHAPTER 08', styles['ch_number']))
    elements.append(Paragraph('Technology Stack', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        'Every technology choice was made deliberately — prioritizing simplicity, '
        'performance, zero build-step deployment, and long-term maintainability.',
        styles['ch_intro']))

    elements.append(Paragraph('8.1  Frontend Stack', styles['h2']))
    fe_data = [
        ['Technology', 'Version / Source', 'Purpose', 'Why Chosen'],
        ['HTML5', 'Native', 'Page structure, semantic markup', 'No framework needed — clean, fast, SEO-friendly'],
        ['CSS3', 'Native', 'Full design system — 65KB style.css', 'CSS variables enable instant dark/light theming'],
        ['Vanilla JavaScript', 'ES6+', 'All interactions, animations, logic', 'Zero dependencies = instant load, full control'],
        ['Space Grotesk', 'Google Fonts', 'Display / heading typography', 'Modern geometric — premium EdTech feel'],
        ['Inter', 'Google Fonts', 'Body / UI text', 'Best legibility at small sizes'],
        ['Font Awesome 6.5', 'CDN', 'Icon system (200+ icons used)', 'Comprehensive — covers education, UI, social icons'],
        ['AOS.js 2.3.4', 'CDN', 'Scroll-triggered animations', 'Lightweight, easy data-aos attributes, well-tested'],
    ]
    elements.append(make_table(fe_data, [80, 80, 120, 142], C_PHYSICS))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('8.2  Backend Stack', styles['h2']))
    be_data = [
        ['Technology', 'Version', 'Purpose'],
        ['Node.js', 'v18+', 'JavaScript runtime — familiar for full-stack JS teams'],
        ['Express.js', 'v4.x', 'HTTP server — minimal, fast, industry-standard routing'],
        ['@libsql/client', 'Latest', 'SQLite database driver — pure JS, no native compilation needed'],
        ['SQLite', 'via libsql', 'File-based database — zero configuration, perfect for this scale'],
        ['Nodemailer', 'Latest', 'Email sending — Gmail SMTP for admin notifications'],
        ['CORS', 'Latest', 'Cross-origin resource sharing — allows frontend→backend calls'],
        ['Helmet.js', 'Latest', 'HTTP security headers — XSS protection, clickjacking prevention'],
        ['express-rate-limit', 'Latest', 'Rate limiting — prevents form spam and API abuse'],
        ['dotenv', 'Latest', 'Environment variables — keeps secrets out of source code'],
    ]
    elements.append(make_table(be_data, [120, 60, 242], C_SUCCESS))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('8.3  Why No React / Vue / Angular?', styles['h2']))
    elements.append(Paragraph(
        'A deliberate, well-reasoned decision: the client needs a website that can be '
        'deployed by dropping files on any host — shared hosting, GitHub Pages, Netlify '
        'free tier, or a simple VPS. No build pipeline, no npm install on deployment, '
        'no framework version conflicts.', styles['body']))
    elements.append(Paragraph(
        'Vanilla HTML/CSS/JS loads in under 1 second on mobile. All 13 files are '
        'immediately editable by anyone. The codebase will not break when a framework '
        'updates. For a tutoring business, this is the right choice.',
        styles['body']))
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 9 — BACKEND ARCHITECTURE
# ════════════════════════════════════════════════════════════
def ch9_backend(elements, styles):
    elements.append(Paragraph('CHAPTER 09', styles['ch_number']))
    elements.append(Paragraph('Backend Architecture', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))

    elements.append(Paragraph('9.1  API Endpoints Reference', styles['h2']))
    api_data = [
        ['Method', 'Endpoint', 'Auth', 'Description'],
        ['GET',    '/api/health', 'None', 'Server health check — returns status and timestamp'],
        ['POST',   '/api/callback', 'None', 'Submit callback request — saves to DB, sends email'],
        ['POST',   '/api/demo', 'None', 'Submit demo class request — saves to DB, sends email'],
        ['POST',   '/api/enroll', 'None', 'Submit enrollment request — saves to DB, sends email'],
        ['GET',    '/api/announcements', 'None', 'Get all announcements (for LMS display)'],
        ['POST',   '/api/admin/login', 'None', 'Admin login — validates credentials, returns token'],
        ['GET',    '/api/admin/stats', 'Token', 'Dashboard statistics — counts per table'],
        ['GET',    '/api/admin/callbacks', 'Token', 'All callback requests, newest first'],
        ['GET',    '/api/admin/demos', 'Token', 'All demo requests, newest first'],
        ['GET',    '/api/admin/enrollments', 'Token', 'All enrollment requests, newest first'],
        ['GET',    '/api/admin/students', 'Token', 'All students with LMS credentials'],
        ['POST',   '/api/admin/students', 'Token', 'Add new student to database'],
        ['PATCH',  '/api/admin/:table/:id/status', 'Token', 'Update status of any record'],
        ['DELETE', '/api/admin/:table/:id', 'Token', 'Delete any record from any table'],
        ['POST',   '/api/admin/announcements', 'Token', 'Post new announcement'],
        ['POST',   '/api/admin/notifications', 'Token', 'Create new admin notification'],
        ['GET',    '/api/admin/notifications', 'Token', 'Get all admin notifications'],
    ]
    elements.append(make_table(api_data, [45, 160, 42, 175], C_DARK))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('9.2  Request Flow — Form Submission', styles['h2']))
    flow = [
        '1.  Student fills form on contact.html / popup',
        '2.  JavaScript fetch() POSTs JSON to /api/demo (or /api/callback, /api/enroll)',
        '3.  Express validates required fields (name, phone)',
        '4.  Data inserted into SQLite database with timestamp and IP',
        '5.  Nodemailer sends email alert to admin (sandeep@conceptwarriors.in)',
        '6.  JSON success response returned to frontend',
        '7.  Frontend shows success popup with WhatsApp link',
        '8.  Admin sees new submission in Dashboard within seconds',
    ]
    for step in flow:
        elements.append(Paragraph(step, styles['bullet']))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph('9.3  Email Notification Format', styles['h2']))
    elements.append(Paragraph(
        'Every form submission triggers an HTML email to the admin with:', styles['body']))
    for item in ['Submission type (Callback / Demo / Enrollment)', 'Student full name',
                 'Phone number (clickable tel: link in email client)', 'Email address',
                 'Class / Course / Exam goal', 'Submission timestamp', 'Brand footer with logo']:
        elements.append(Paragraph(f'✉  {item}', styles['bullet']))
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 10 — DATABASE SCHEMA
# ════════════════════════════════════════════════════════════
def ch10_database(elements, styles):
    elements.append(Paragraph('CHAPTER 10', styles['ch_number']))
    elements.append(Paragraph('Database Schema', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        'The backend uses SQLite — a file-based relational database stored at '
        'cw-backend/data/concept_warriors.db. No external database server required.',
        styles['ch_intro']))

    tables = [
        ('callback_requests', [
            ('id', 'INTEGER PK', 'Auto-increment primary key'),
            ('name', 'TEXT NOT NULL', 'Caller full name'),
            ('phone', 'TEXT NOT NULL', 'Contact phone number'),
            ('email', 'TEXT', 'Email (optional)'),
            ('time_slot', 'TEXT', 'Preferred callback time'),
            ('status', "TEXT DEFAULT 'New'", 'New / Contacted / Closed'),
            ('ip', 'TEXT', 'Submitter IP for spam tracking'),
            ('created_at', 'TEXT', 'datetime(now, localtime)'),
        ]),
        ('demo_requests', [
            ('id', 'INTEGER PK', 'Auto-increment'),
            ('name', 'TEXT NOT NULL', 'Student name'),
            ('phone', 'TEXT NOT NULL', 'Phone'),
            ('email', 'TEXT', 'Email'),
            ('class', 'TEXT', 'Class 8–12 or Dropper'),
            ('goal_exam', 'TEXT', 'NEET / JEE / CUET / Board'),
            ('status', "TEXT DEFAULT 'New'", 'New / Contacted / Enrolled'),
            ('notes', 'TEXT', 'Admin notes'),
            ('ip', 'TEXT', 'IP address'),
            ('created_at', 'TEXT', 'Timestamp'),
        ]),
        ('enrollments', [
            ('id', 'INTEGER PK', 'Auto-increment'),
            ('name', 'TEXT NOT NULL', 'Student name'),
            ('phone', 'TEXT NOT NULL', 'Phone'),
            ('email', 'TEXT', 'Email'),
            ('course', 'TEXT', 'Selected course'),
            ('mode', 'TEXT', 'Online / Offline / Home / 1-on-1'),
            ('message', 'TEXT', 'Additional message'),
            ('status', "TEXT DEFAULT 'New'", 'New / Enrolled'),
            ('ip', 'TEXT', 'IP'),
            ('created_at', 'TEXT', 'Timestamp'),
        ]),
        ('students', [
            ('id', 'INTEGER PK', 'Auto-increment'),
            ('name', 'TEXT NOT NULL', 'Full name'),
            ('phone', 'TEXT NOT NULL', 'Phone'),
            ('email', 'TEXT', 'Email'),
            ('course', 'TEXT', 'Enrolled course'),
            ('mode', 'TEXT', 'Teaching mode'),
            ('class', 'TEXT', 'Current class'),
            ('status', "TEXT DEFAULT 'Active'", 'Active / Inactive'),
            ('lms_user', 'TEXT', 'LMS login email'),
            ('lms_pass', 'TEXT', 'LMS password'),
            ('notes', 'TEXT', 'Admin notes'),
            ('enrolled_at', 'TEXT', 'Enrollment timestamp'),
        ]),
    ]

    for tname, cols in tables:
        elements.append(Paragraph(f'Table: {tname}', styles['h3']))
        col_data = [['Column', 'Type', 'Description']] + cols
        elements.append(make_table(col_data, [90, 130, 202], C_MUTED))
        elements.append(Spacer(1, 10))

    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 11 — FILE STRUCTURE & DELIVERABLES
# ════════════════════════════════════════════════════════════
def ch11_files(elements, styles):
    elements.append(Paragraph('CHAPTER 11', styles['ch_number']))
    elements.append(Paragraph('File Structure & Deliverables', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))

    elements.append(Paragraph('11.1  Complete File Tree', styles['h2']))
    tree_lines = [
        'concept-warriors-website.zip',
        '├── concept-warriors/          ← FRONTEND (drop on any web host)',
        '│   ├── index.html             ← Home Page (40KB)',
        '│   ├── about.html             ← About Sandeep Kumar (22KB)',
        '│   ├── courses.html           ← Courses & Programs (28KB)',
        '│   ├── mentorship.html        ← Mentorship Programs (17KB)',
        '│   ├── exam-prep.html         ← Exam Preparation Tabs (26KB)',
        '│   ├── contact.html           ← Contact + 3 Forms (16KB)',
        '│   ├── lms-login.html         ← Student LMS Login (9KB)',
        '│   ├── lms-dashboard.html     ← Student Dashboard (48KB)',
        '│   ├── admin-login.html       ← Admin Login (7KB)',
        '│   ├── admin.html             ← Admin Dashboard (54KB)',
        '│   ├── style.css              ← Complete Design System (65KB)',
        '│   └── script.js              ← All JS Logic (23KB)',
        '│',
        '└── cw-backend/               ← BACKEND (deploy on Node.js server)',
        '    ├── server.js              ← Main Express server + all routes',
        '    ├── .env.example           ← Environment variable template',
        '    ├── package.json           ← Node.js dependencies',
        '    ├── node_modules/          ← Installed packages (auto-generated)',
        '    └── data/',
        '        └── concept_warriors.db ← SQLite database (auto-created)',
    ]
    for line in tree_lines:
        elements.append(Paragraph(line, styles['code']))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('11.2  File Size Summary', styles['h2']))
    size_data = [
        ['File', 'Size', 'Contents'],
        ['style.css', '65 KB', 'Complete design system — 800+ CSS rules, all components, dark/light themes'],
        ['admin.html', '54 KB', 'Full admin CRM — 6 sections, all tables, charts, forms, JS logic'],
        ['lms-dashboard.html', '48 KB', 'Complete student portal — 10 sections, all widgets'],
        ['index.html', '40 KB', 'Home page — hero, all sections, popups, chatbot, FAQ (15 items)'],
        ['script.js', '23 KB', 'All JavaScript — themes, animations, chatbot, auth, admin, counters'],
        ['courses.html', '28 KB', '9 course cards, filter system, teaching modes section'],
        ['exam-prep.html', '26 KB', '4 tabbed exam sections with full roadmaps'],
        ['about.html', '22 KB', 'Tutor bio, timeline, skills, achievements, philosophy'],
        ['contact.html', '16 KB', '3 contact forms, info card, map placeholder'],
        ['mentorship.html', '17 KB', '6 mentorship cards, 6-step roadmap, CTAs'],
        ['lms-login.html', '9 KB', 'Split-panel login with feature list'],
        ['admin-login.html', '7 KB', 'Secure admin login with credential display'],
        ['server.js', '~18 KB', 'Complete backend — 17 API endpoints, DB init, email, security'],
        ['TOTAL', '~372 KB', 'Complete production website — all pages, all features'],
    ]
    elements.append(make_table(size_data, [130, 55, 237], C_PRIMARY))
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 12 — SECURITY & PERFORMANCE
# ════════════════════════════════════════════════════════════
def ch12_security(elements, styles):
    elements.append(Paragraph('CHAPTER 12', styles['ch_number']))
    elements.append(Paragraph('Security & Performance', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))

    elements.append(Paragraph('12.1  Security Measures Implemented', styles['h2']))
    sec_data = [
        ['Measure', 'Where', 'Protection Against'],
        ['Helmet.js headers', 'Backend', 'XSS, clickjacking, MIME sniffing, referrer leaks'],
        ['Rate Limiting (20/15min)', 'Form endpoints', 'Form spam, brute force, API abuse'],
        ['Rate Limiting (50/15min)', 'Admin endpoints', 'Admin brute force attempts'],
        ['Input Validation', 'All POST routes', 'Empty submissions, required field bypass'],
        ['CORS policy', 'Backend', 'Cross-origin API calls from unauthorized domains'],
        ['X-Admin-Token header', 'Admin routes', 'Unauthorized data access or modification'],
        ['IP logging', 'All form submissions', 'Spam tracking and pattern detection'],
        ['.env secrets', 'Backend config', 'SMTP credentials not in source code'],
        ['Auth redirect guards', 'LMS + Admin pages', 'Direct URL access without login'],
        ['No SQL injection risk', 'Database layer', 'Parameterized queries via @libsql/client'],
    ]
    elements.append(make_table(sec_data, [140, 80, 202], C_DANGER))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('12.2  Performance Optimizations', styles['h2']))
    perf = [
        'Zero JavaScript frameworks — no React bundle, no Vue overhead. Pure JS loads instantly.',
        'CDN delivery for AOS.js and Font Awesome — leverages global edge caches.',
        'CSS custom properties (variables) enable theme switching without re-parsing styles.',
        'IntersectionObserver for counter animations — only fires when element is visible.',
        'Smooth scroll via CSS scroll-behavior — no JS scroll calculation overhead.',
        'Images: no large images used — all visuals are pure CSS gradients and SVG icons.',
        'Font preconnect hints in <head> reduce Google Fonts connection latency.',
        'Minimal HTTP requests: 3 files per page (HTML + style.css + script.js + 2 CDNs).',
        'SQLite database: file-based, zero network latency for queries on same server.',
        'Backend rate limiting prevents resource exhaustion from traffic spikes.',
    ]
    for p in perf:
        elements.append(Paragraph(f'⚡  {p}', styles['bullet']))
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 13 — DEPLOYMENT GUIDE
# ════════════════════════════════════════════════════════════
def ch13_deployment(elements, styles):
    elements.append(Paragraph('CHAPTER 13', styles['ch_number']))
    elements.append(Paragraph('Deployment Guide', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))

    elements.append(Paragraph('13.1  Option A — Frontend Only (Simplest)', styles['h2']))
    elements.append(Paragraph(
        'If you only want the marketing website without form data going to a real backend '
        '(using localStorage as demo), deploy just the frontend:', styles['body']))
    steps_a = [
        'Extract the concept-warriors/ folder from the ZIP',
        'Upload all 13 files to any web hosting (Hostinger, GoDaddy, Namecheap, Netlify, Vercel)',
        'Point your domain to the hosting — set index.html as the entry point',
        'Done! All popups, chatbot, dark mode, LMS demo, admin demo work immediately',
        'Form data stores in browser localStorage — visible in admin demo panel',
    ]
    for i, s in enumerate(steps_a, 1):
        elements.append(Paragraph(f'{i}.  {s}', styles['bullet']))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph('13.2  Option B — Full Stack with Real Database', styles['h2']))
    elements.append(Paragraph(
        'To receive form submissions in a real database and get email notifications:',
        styles['body']))
    steps_b = [
        'Get a Node.js server: Render.com (free tier), Railway.app, DigitalOcean, or any VPS',
        'Upload entire project (both concept-warriors/ and cw-backend/ folders)',
        'In cw-backend/, copy .env.example to .env and fill in SMTP_USER and SMTP_PASS',
        'To get Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords',
        'Run: cd cw-backend && npm install && node server.js',
        'Server starts on port 3000 (configurable via PORT in .env)',
        'Update all fetch() calls in contact.html to point to your server URL',
        'Set up Nginx reverse proxy for HTTPS (recommended for production)',
        'Use PM2 for process management: npm install -g pm2 && pm2 start server.js',
    ]
    for i, s in enumerate(steps_b, 1):
        elements.append(Paragraph(f'{i}.  {s}', styles['bullet']))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph('13.3  Recommended Free Hosting Options', styles['h2']))
    host_data = [
        ['Platform', 'Best For', 'Free Tier', 'Notes'],
        ['Netlify', 'Frontend only', 'Yes — generous', 'Drag & drop folder deploy. Custom domain free.'],
        ['Vercel', 'Frontend only', 'Yes', 'GitHub integration. Fast global CDN.'],
        ['Render.com', 'Full stack (Node)', 'Yes — spins down', 'Free Node.js hosting. Spins down after inactivity.'],
        ['Railway.app', 'Full stack (Node)', '$5 credit/month', 'Always-on. Best free full-stack option.'],
        ['GitHub Pages', 'Frontend only', 'Yes', 'Free. Custom domain supported. No server-side.'],
        ['DigitalOcean', 'VPS full control', '$6/month min', 'Best for production. Full control. HTTPS easy.'],
    ]
    elements.append(make_table(host_data, [80, 90, 70, 182], C_SUCCESS))
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 14 — CREDENTIALS REFERENCE
# ════════════════════════════════════════════════════════════
def ch14_credentials(elements, styles):
    elements.append(Paragraph('CHAPTER 14', styles['ch_number']))
    elements.append(Paragraph('Credentials Reference', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))

    warn_data = [[Paragraph(
        '⚠️  IMPORTANT: The credentials below are demo/default values for testing. '
        'Change them before deploying to a public URL. '
        'Never share admin credentials publicly.',
        ParagraphStyle('warn', fontName='Helvetica-Bold', fontSize=9.5, textColor=HexColor('#92400E')))]]
    wt = Table(warn_data, colWidths=[W - 80])
    wt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#FEF3C7')),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BOX', (0, 0), (-1, -1), 1.5, HexColor('#D97706')),
        ('ROUNDEDCORNERS', [6]),
    ]))
    elements.append(wt)
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('14.1  LMS Student Login', styles['h2']))
    lms_data = [
        ['User', 'Email', 'Password', 'Notes'],
        ['Demo Student', 'student@demo.com', 'demo123', 'General demo account'],
        ['Arjun Patel', 'arjun@cw.in', 'arjun123', 'Sample enrolled student'],
        ['Simran Kaur', 'simran@cw.in', 'simran123', 'Sample enrolled student'],
    ]
    elements.append(make_table(lms_data, [90, 130, 100, 102], C_PRIMARY))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('14.2  Admin Panel Login', styles['h2']))
    admin_data = [
        ['Role', 'Email', 'Password', 'Access Level'],
        ['Super Admin', 'admin@conceptwarriors.in', 'Admin@2025', 'Full access — all sections'],
    ]
    elements.append(make_table(admin_data, [80, 160, 100, 82], C_DANGER))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('14.3  How to Change Credentials', styles['h2']))
    change_steps = [
        'LMS Passwords: In script.js, find the validCreds array and update email/password/name values',
        'Admin Password: In cw-backend/server.js, find the admin_users table seed and change the password value',
        'For production: Use a proper hashed password system (bcrypt) and environment variables',
        'Student onboarding: Admin dashboard → Students tab → Add New Student (sets LMS credentials)',
    ]
    for s in change_steps:
        elements.append(Paragraph(f'→  {s}', styles['bullet']))
    elements.append(Spacer(1, 14))

    elements.append(Paragraph('14.4  WhatsApp & Contact Details', styles['h2']))
    contact_data = [
        ['Item', 'Value', 'Used In'],
        ['WhatsApp Number', '+91 8427168892', 'All pages — float button, CTA, forms'],
        ['Email', 'sandeep@conceptwarriors.in', 'Footer, contact page, email alerts'],
        ['Brand Name', 'The Concept Warriors', 'All page titles, headers, footers'],
        ['Tutor Name', 'Sandeep Kumar', 'All pages, about page, hero card'],
    ]
    elements.append(make_table(contact_data, [120, 150, 152], C_DARK))
    elements.append(PageBreak())


# ════════════════════════════════════════════════════════════
#  CHAPTER 15 — FUTURE ENHANCEMENTS
# ════════════════════════════════════════════════════════════
def ch15_future(elements, styles):
    elements.append(Paragraph('CHAPTER 15', styles['ch_number']))
    elements.append(Paragraph('Future Enhancements', styles['ch_title']))
    elements.append(SectionDivider())
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        'The current delivery is a complete, production-ready v1.0. '
        'The following enhancements are recommended for v2.0 based on business growth.',
        styles['ch_intro']))

    future_data = [
        ['Enhancement', 'Priority', 'Effort', 'Business Value'],
        ['Real payment gateway (Razorpay / PayU)', 'High', 'Medium', 'Enable direct online fee collection'],
        ['JWT-based authentication system', 'High', 'Medium', 'More secure than localStorage token'],
        ['bcrypt password hashing', 'High', 'Low', 'Secure stored passwords properly'],
        ['Real-time notifications (Socket.io)', 'Medium', 'Medium', 'Instant admin alerts on new leads'],
        ['Video lecture upload & streaming', 'High', 'High', 'Full in-platform LMS video library'],
        ['Online quiz / test engine', 'High', 'High', 'In-platform mock tests with auto-scoring'],
        ['Parent portal / login', 'Medium', 'Medium', 'Parents view child progress directly'],
        ['Automated WhatsApp API (WATI)', 'Medium', 'Medium', 'Auto-reply and follow-up messages'],
        ['Push notifications (PWA)', 'Low', 'Medium', 'Class reminders, result notifications'],
        ['Razorpay recurring payments', 'Medium', 'Medium', 'Monthly fee auto-debit for students'],
        ['Google Analytics / Meta Pixel', 'Medium', 'Low', 'Track conversions and ad performance'],
        ['Blog / Study Resources section', 'Low', 'Low', 'SEO traffic from educational content'],
        ['Referral rewards system', 'Low', 'High', 'Incentivize student referrals'],
        ['Multi-tutor support', 'Low', 'High', 'Expand to team of tutors under one brand'],
    ]
    elements.append(make_table(future_data, [155, 52, 45, 170], C_PURPLE))
    elements.append(Spacer(1, 20))

    # Closing note
    close_data = [[Paragraph(
        'This project was designed and delivered with the vision of The Concept Warriors '
        'in mind — a premium, trust-first EdTech brand that matches the real quality of '
        'Sandeep Kumar\'s teaching. Every design decision, every feature, and every line '
        'of code was written to serve one goal: help more students discover, trust, and '
        'enroll with Sandeep Sir.\n\n'
        'Better Concepts. Better Confidence. Better Future. ⚡',
        ParagraphStyle('closing', fontName='Helvetica', fontSize=11, textColor=C_WHITE,
                       leading=18, alignment=TA_CENTER))]]
    ct = Table(close_data, colWidths=[W - 80])
    ct.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_HEADING_BG),
        ('LEFTPADDING', (0, 0), (-1, -1), 24),
        ('RIGHTPADDING', (0, 0), (-1, -1), 24),
        ('TOPPADDING', (0, 0), (-1, -1), 24),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 24),
        ('ROUNDEDCORNERS', [10]),
    ]))
    elements.append(ct)


# ════════════════════════════════════════════════════════════
#  MAIN BUILD FUNCTION
# ════════════════════════════════════════════════════════════
def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=40, rightMargin=40,
        topMargin=52, bottomMargin=42,
        title='The Concept Warriors — Project Documentation',
        author='Development Team',
        subject='Full EdTech Website Project Documentation',
        creator='The Concept Warriors Build System',
    )

    styles = make_styles()
    page_cb = DocCanvas('Project Documentation — v1.0')
    elements = []

    cover_page(elements, styles)
    table_of_contents(elements, styles)
    ch1_overview(elements, styles)
    ch2_requirements(elements, styles)
    ch3_design_thinking(elements, styles)
    ch4_architecture(elements, styles)
    ch5_uiux(elements, styles)
    ch6_pages(elements, styles)
    ch7_features(elements, styles)
    ch8_tech(elements, styles)
    ch9_backend(elements, styles)
    ch10_database(elements, styles)
    ch11_files(elements, styles)
    ch12_security(elements, styles)
    ch13_deployment(elements, styles)
    ch14_credentials(elements, styles)
    ch15_future(elements, styles)

    doc.build(elements, onFirstPage=page_cb, onLaterPages=page_cb)
    print(f"✅ PDF generated: {output_path}")


if __name__ == '__main__':
    import os
    out = '/mnt/user-data/outputs/Concept-Warriors-Project-Documentation.pdf'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    build_pdf(out)