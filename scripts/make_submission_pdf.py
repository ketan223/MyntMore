"""Create a truthful local handoff draft. Requires reportlab from Codex bundled Python."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import simpleSplit
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.pagesizes import A4

OUT = Path("output/pdf/Ketan_Tiwari_Systems_AI_Automation_Intern_DRAFT.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)
ink = colors.HexColor("#172821")
green = colors.HexColor("#577A35")
line = colors.HexColor("#DCE4D8")
muted = colors.HexColor("#5D6F64")
cream = colors.HexColor("#F6F8EF")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleX", fontName="Helvetica-Bold", fontSize=22, leading=27, textColor=ink, spaceAfter=10))
styles.add(ParagraphStyle(name="SubtitleX", fontName="Helvetica", fontSize=10, leading=15, textColor=muted, spaceAfter=15))
styles.add(ParagraphStyle(name="H1X", fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=green, spaceBefore=13, spaceAfter=7))
styles.add(ParagraphStyle(name="BodyX", fontName="Helvetica", fontSize=9, leading=13.5, textColor=ink, spaceAfter=7))
styles.add(ParagraphStyle(name="SmallX", fontName="Helvetica", fontSize=8, leading=11.5, textColor=ink, spaceAfter=4))
styles.add(ParagraphStyle(name="NoteX", fontName="Helvetica-Bold", fontSize=8, leading=12, textColor=colors.HexColor("#8D4F18"), spaceAfter=8))
styles.add(ParagraphStyle(name="TableX", fontName="Helvetica", fontSize=7.4, leading=10.5, textColor=ink))

P = lambda text, style="BodyX": Paragraph(text, styles[style])
story = []
story += [P("Ketan Tiwari", "TitleX"), P("Systems + AI Automation Intern (Round 2) | Working draft | 8 October 2026", "SubtitleX")]
story += [P("NOT READY TO SUBMIT: live account setup, links, AI-search screenshots, and Loom still need verification.", "NoteX")]
story += [P("01  Lead follow-up engine", "H1X")]
story += [P("Imported-source design: all 20 fictional sessions remain in raw_leads. Fixed rules normalize emails, flag tests and incomplete rows, identify repeat contacts, choose a service, score fit from 1 to 10, and route each row. Gemini 2.5 Flash writes only eligible follow-up drafts. Hot rows create an alert record; Warm rows receive one nurture draft; Not a fit rows keep a reason and receive no draft. The automation never sends an email.")]
story += [P("Local rule preview: <b>8 Hot, 4 Warm, 8 Not a fit</b>. L11 repeats L03 but remains a separate session; L15 is a different contact at the same company. L05 is incomplete, L07 is a test, L09 and L14 are job seekers, L16 appears to sell a competing service, L18 lacks an email, and L19 contains an instruction-injection attempt. These are local results, not a claim of a live Gemini or CRM run.", "SmallX")]
story += [P("02  LinkedIn Hook Grader", "H1X")]
story += [P("A one-page Next.js flow collects name, designation, email, and the first two hook lines. Five fixed checks award 20 points each: two-line shape, 8-35 words, named subject, concrete detail, and readable length/case. Gemini returns exactly three two-line rewrites as structured JSON. The server saves each session in Supabase before calling the Make webhook. The same hook always receives the same code score.")]
story += [P("Project evidence and links", "H1X")]
data = [
    [P("Item", "TableX"), P("Status / link", "TableX")],
    [P("Code", "TableX"), P("Local repository built and tested; GitHub URL pending candidate push", "TableX")],
    [P("Live tool", "TableX"), P("Vercel deployment pending account credentials", "TableX")],
    [P("Automation", "TableX"), P("Make scenario guide supplied; live webhook pending", "TableX")],
    [P("CRM", "TableX"), P("Zoho draft-only integration coded; OAuth setup pending", "TableX")],
    [P("Loom", "TableX"), P("Camera-on walkthrough pending", "TableX")],
]
table = Table(data, colWidths=[95, 390], hAlign="LEFT", repeatRows=1)
table.setStyle(TableStyle([("BACKGROUND", (0,0),(-1,0),cream),("GRID",(0,0),(-1,-1),0.4,line),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7)]))
story += [table, Spacer(1, 12), P("Implementation details, account steps, failure recovery, and a reusable Antigravity prompt are in README.md and docs/SETUP.md in the repository.", "SmallX")]
story += [PageBreak(), P("03  Ops judgement", "TitleX"), P("One-page written section | Draft pending AI-platform evidence", "SubtitleX")]
story += [P("3a. Silent bug", "H1X")]
story += [P("The Supabase leads_source_check constraint allows seven tools but omits battle_card_generator and case_study_generator. Zoho receives those leads because postToZohoForm runs first. Supabase then rejects the insert; the code only logs the error and returns undefined, so later tool input/output saves lose the lead ID. I would migrate the constraint to include both sources, make insert errors throw, and save lead plus tool data with an idempotent session key. I would add a test for every source, daily per-source count reconciliation between Zoho and Supabase, an error queue, and alerts for any failed insert. I would backfill the missing sessions after the fix.")]
story += [P("3b. AI search", "H1X")]
story += [P("The required 15 answers have not yet been collected directly in ChatGPT, Perplexity, and Gemini. The repository contains five exact client questions and a 15-row worksheet for appearance, position, other providers, one-line answer, cited sources, and screenshot. No platform answer is fabricated in this draft.")]
story += [P("Provisional website changes to validate against those answers:", "SmallX")]
story += [P("1. Publish dedicated service pages that clearly connect each audience and geography with LinkedIn outreach, cold email, personal branding, and ICP work, linking each from relevant free tools.", "SmallX")]
story += [P("2. Publish dated, client-approved case studies with method and scoped results so answer engines can cite concrete evidence.", "SmallX")]
story += [P("3. Maintain a clear organization/about page with consistent business facts, service descriptions, contact details, and structured data.", "SmallX")]
story += [Spacer(1, 18), P("Before submission: replace this draft with the copied assignment document, verified personal email and real links, 15 direct AI-search observations, screenshot links, and the completed Loom. Export that document as the final PDF and reply in the original email thread.", "NoteX")]

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(line)
    canvas.line(48, 43, A4[0]-48, 43)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(muted)
    canvas.drawString(48, 30, "Ketan Tiwari | Myntmore Round 2 | Working draft")
    canvas.drawRightString(A4[0]-48, 30, f"Page {doc.page}")
    canvas.restoreState()

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=48, leftMargin=48, topMargin=43, bottomMargin=55)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT.resolve())
