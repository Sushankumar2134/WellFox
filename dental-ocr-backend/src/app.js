const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const recordRoutes = require('./routes/recordRoutes');
const documentRoutes = require('./routes/documentRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/generated', express.static(path.join(__dirname, '..', 'generated')));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() },
  });
});

app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/pdf', pdfRoutes);

app.use(errorHandler);

module.exports = app;
