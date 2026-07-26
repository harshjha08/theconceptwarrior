# The Concept Warriors

A premium tutoring and coaching website designed for The Concept Warriors, a client-based education brand focused on Physics, Chemistry, Mathematics, NEET, JEE, CUET, and board exam preparation.

This project is a modern, responsive, and professional static website built to showcase courses, provide admission information, enable demo-class bookings, display fee structures, and support student engagement through a polished online presence.

---

## 1. Project Overview

The Concept Warriors is an educational platform created to help students and parents access coaching-related information easily and confidently. The website is designed to:

- Present the brand and founder’s teaching philosophy
- Highlight academic courses and mentorship programs
- Encourage free demo class bookings
- Capture student inquiries for admissions
- Provide a formal online presence for a tutoring business

This project is developed for a specific client and is intended for private, authorized use only.

---

## 2. Purpose of the Project

The website serves as a digital front door for the coaching institute. It allows potential students and parents to:

- Learn about the institute and its teaching approach
- Explore programs for different classes and competitive exams
- Connect through inquiry and demo booking forms
- Contact the tutor directly via WhatsApp, phone, or email
- Access a structured and professional educational brand experience

---

## 3. Key Features

### Website Features
- Responsive landing page for desktop and mobile
- Modern UI with animated sections and smooth transitions
- Preloader and interactive welcome popup
- Demo class booking popup
- Enrollment inquiry form
- FAQ section
- Testimonials carousel
- Counter animations for key statistics
- Theme toggle between light and dark mode
- Chatbot-style assistance for common queries
- Separate pages for About, Courses, Mentorship, Exam Prep, Fees, Contact, and Student Resources

### Functional Highlights
- Contact and inquiry forms integrated with Formspree
- WhatsApp contact option for quick communication
- Student resources page for LMS-style access
- Structured content for coaching and academic support
- SEO meta tags and social sharing metadata

### Documentation Feature
- A Python-based PDF documentation generator is included to build a professional project documentation file.

---

## 4. Project Description

This repository contains the complete front-end website for The Concept Warriors, including:

- Static web pages written in HTML
- Styling with CSS
- Interactivity with JavaScript
- Supporting assets such as images and icons
- A Python script for generating project documentation as a PDF file

The site is designed to be lightweight, easy to host, and simple to maintain.

---

## 5. Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Styling and UI Enhancements
- Font Awesome icons
- Google Fonts
- AOS (Animate On Scroll)

### Backend / Form Handling
- Formspree for form submission handling

### Documentation Generation
- Python
- ReportLab

---

## 6. Project Structure

```text
The Concept Warriors/
├── index.html
├── generate_pdf.py
├── google694898bc6c42d26e.html
├── robots.txt
├── sitemap.xml
├── assets/
│   └── web page Images/
├── CSS/
│   ├── common.css
│   ├── exam-prep.css
│   ├── feedback.css
│   ├── fees.css
│   ├── legal-shared.css
│   ├── lms-dashboard.css
│   ├── preloader.css
│   ├── style.css
│   └── underConstruction.css
├── pages/
│   ├── about.html
│   ├── admin-login.html
│   ├── admin.html
│   ├── contact.html
│   ├── copyright.html
│   ├── courses.html
│   ├── exam-prep.html
│   ├── feedback.html
│   ├── fees.html
│   ├── feesextra.html
│   ├── lms-dashboard.html
│   ├── lms-dashboardOriginal.html
│   ├── lms-login.html
│   ├── mentorship.html
│   ├── privacy.html
│   ├── terms.html
└── scripts/
    └── script.js
```

---

## 7. Main Files

### index.html
The main homepage of the website, containing the hero section, navigation, popup forms, and core content.

### pages/
Contains all additional pages such as About, Courses, Contact, Fees, Mentorship, and Student Resources.

### CSS/
Stores the custom stylesheet files used across the website.

### scripts/script.js
Handles website interactivity such as:
- preloader behavior
- theme toggling
- navbar menu interaction
- popup opening and closing
- demo and enrollment form logic
- testimonial carousel
- chatbot interactions

### generate_pdf.py
Generates a detailed PDF documentation file for the project using ReportLab.

---

## 8. How to Run the Project Locally

### Option 1: Open directly in the browser
You can open the project by launching the main file:

- Open index.html in your browser

This is suitable for a static website and does not require a server.

### Option 2: Run a local server
If you want to serve the site locally, use Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 3: Generate the documentation PDF
Install ReportLab if needed:

```bash
pip install reportlab
```

Then run:

```bash
python generate_pdf.py
```

The script will generate a PDF documentation file for the project.

---

## 9. Pages Included

The website includes the following pages:

- Home
- About
- Courses
- Mentorship
- Exam Prep
- Fees
- Contact
- LMS Dashboard
- Privacy Policy
- Terms and Conditions
- Copyright Information
- Admin-related pages

---

## 10. Features in Detail

### Home Page
The homepage is designed to create a strong first impression and includes:
- Brand introduction
- Learning highlights
- Student-focused messaging
- Free demo booking CTA
- Enrollment prompts
- Social-proof style testimonials

### Courses and Mentorship Pages
These pages explain the training structure, exam-focused preparation, and personalized coaching options.

### Fee Structure Page
Provides clarity about available programs and general pricing-related information.

### Contact Page
Contains contact details and communication channels for student inquiries.

### LMS / Student Resources Page
Provides a dashboard-style experience for students to access learning resources.

---

## 11. Form and Contact Information

The website includes forms for:
- Free demo class booking
- Enrollment inquiry
- General contact submissions

The forms are connected to external services for message delivery and lead collection.

### Contact Details Used in Site
- Phone: +91 8427168892
- WhatsApp: +91 8427168892
- Email: sandeep@conceptwarriors.in
- Location: Punjab, India (Online Nationwide)

---

## 12. SEO and Metadata

The website includes:
- Page title and meta description
- Keywords
- Canonical URL
- Open Graph tags
- Twitter card metadata
- Structured data for educational organization
- Sitemap and robots file support

---

## 13. Deployment Notes

This website is a static project and can be deployed on platforms such as:
- Vercel
- Netlify
- GitHub Pages
- Any simple static hosting service

For deployment, upload the project root contents to the hosting platform and ensure the relative links remain intact.

---

## 14. Notes for Maintenance

When updating the website:
- Keep the file paths relative for assets and pages
- Preserve the structure of the CSS and JS files
- Ensure form endpoints remain active
- Verify that all updated content is consistent across home and inner pages
- Keep branding and contact details up to date

---

## 15. Copyright and Ownership Notice

Copyright © 2026 Sandeep Kumar / The Concept Warriors. All rights reserved.

This is a client-based private project and is the exclusive property of the owner. No part of this website, design, code, content, assets, structure, branding, or documentation may be copied, reproduced, modified, distributed, reused, sold, sublicensed, or republished without explicit written consent from the owner.

The following are strictly prohibited without prior written permission:
- Copying or cloning the project
- Reusing the code or design
- Modifying the website for another business or person
- Redistributing or publishing the project publicly
- Using any part of the project for commercial or personal benefit without approval

This project is not open-source and must not be treated as free to reuse.

If you want to use, adapt, or repurpose this project in any way, you must first obtain written permission from the owner.

---

## 16. Final Note

This README is created for documentation and project reference purposes. It should be treated as part of a private, client-owned educational website project and not as a public open-source resource.
