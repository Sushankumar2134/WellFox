# Dental OCR – Patient Record Management Application

## Technical Assessment

This project is developed as part of the technical assessment.

The application is a dental patient record management system that allows users to scan and process dental documents, extract relevant patient and record information using OCR, review the extracted information, and save it into the patient record system.

### Assessment Requirements

As part of the assessment, candidates are required to complete any ONE of the three technical tasks provided in the assignment. The selected task has been implemented using React Native with a Node.js backend.

### Technology Stack

- **Mobile Application:** React Native
- **Backend:** Node.js / Express
- **Database:** SQLite
- **OCR:** Tesseract.js
- **Document Processing:** PDF processing and OCR
- **Navigation:** React Navigation
- **UI:** React Native components
- **File Handling:** Multer
- **PDF Generation:** PDFKit

### Key Features

- Scan dental documents using the mobile application
- Upload documents from the device gallery
- OCR-based text extraction
- Automatic extraction of patient and dental record information
- Review and edit extracted information before saving
- Patient management
- Dental record management
- Doctor information management
- Document upload and storage
- OCR raw-text storage
- Patient record history
- Payment information
- PDF generation for complete patient records
- Downloadable patient record PDF
- Error handling and validation

### Application Flow

1. **Scan / Upload Document**
   - Capture a document using the device camera or select a document from the gallery.

2. **OCR Processing**
   - The document is sent to the Node.js backend.
   - Tesseract.js processes the uploaded document and extracts the text.

3. **Information Extraction**
   - Extracted text is processed to identify relevant fields such as:
     - Patient name
     - Age
     - Gender
     - Phone number
     - Date
     - Receipt number
     - Doctor information

4. **Review Record**
   - Extracted information is displayed in a review screen.
   - The user can verify and edit the information before saving.

5. **Save Patient Record**
   - Patient information and dental record information are stored in the database.
   - Associated documents and OCR information are also stored.

6. **Patient Management**
   - Saved patients can be viewed from the patient list.
   - Individual patient details and dental records can be accessed.

7. **PDF Export**
   - A complete patient record PDF can be generated.
   - The generated PDF contains patient information, visit records, doctor information, procedures, payment information, and associated documents.

### Backend API

The backend provides REST APIs for:

- Patient management
- Doctor management
- Dental records
- Documents
- OCR processing
- PDF generation

### Project Structure

```text
WellFox/
│
├── dental-ocr/
│   ├── App.tsx
│   ├── screens/
│   ├── services/
│   ├── config.ts
│   └── ...
│
└── dental-ocr-backend/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── services/
    ├── middleware/
    ├── config/
    ├── utils/
    ├── app.js
    └── server.js
