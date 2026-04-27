/* eslint-disable @typescript-eslint/indent */
import ExcelJS from 'exceljs';
import { Project } from '../../interfaces/Project';

/**
 * Flatten nested project data for export
 */
const flattenProjectForExport = (project: any) => {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    address: project.address || '',
    city: project.city || '',
    metroArea: project.metroArea || '',
    country: project.country || '',
    buildingType: project.buildingType || '',
    buildingUses: Array.isArray(project.buildingUses)
      ? project.buildingUses
          .map((bu: any) => bu.buildingUse || bu.building_use)
          .join(', ')
      : '',
    buildingHeightMeters: project.buildingHeightMeters || '',
    buildingHeightFloors: project.buildingHeightFloors || '',
    budgetEur: project.budgetEur || '',
    glassFacade: project.glassFacade ? 'Yes' : 'No',
    facadeBasis: project.facadeBasis || '',
    expectedDateText: project.expectedDateText || '',
    expectedDate: project.expectedDate || '',
    confidenceScore: project.confidenceScore || '',
    isActive: project.isActive ? 'Yes' : 'No',
    createdAt: project.createdAt || '',
    updatedAt: project.updatedAt || '',
    lastVerifiedDate: project.lastVerifiedDate || '',
    media: Array.isArray(project.media)
      ? project.media
          .map((m: any) => (typeof m === 'string' ? m : m?.url))
          .filter(Boolean)
          .join('; ')
      : '',
    favoritedByUsers: Array.isArray(project.favoritedByUsers)
      ? project.favoritedByUsers.map((u: any) => u.username).join(', ')
      : ''
  };
};

/**
 * Generate Excel buffer from projects
 */
export const generateExcelBuffer = async (
  projects: Project[]
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Projects');

  // Define columns
  const columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Address', key: 'address', width: 30 },
    { header: 'City', key: 'city', width: 15 },
    { header: 'Metro Area', key: 'metroArea', width: 20 },
    { header: 'Country', key: 'country', width: 15 },
    { header: 'Building Type', key: 'buildingType', width: 20 },
    { header: 'Building Uses', key: 'buildingUses', width: 25 },
    { header: 'Height (m)', key: 'buildingHeightMeters', width: 12 },
    { header: 'Height (floors)', key: 'buildingHeightFloors', width: 12 },
    { header: 'Budget (EUR)', key: 'budgetEur', width: 15 },
    { header: 'Glass Facade', key: 'glassFacade', width: 12 },
    { header: 'Facade Basis', key: 'facadeBasis', width: 15 },
    { header: 'Expected Date', key: 'expectedDateText', width: 15 },
    { header: 'Expected Date (Parsed)', key: 'expectedDate', width: 15 },
    { header: 'Confidence Score', key: 'confidenceScore', width: 15 },
    { header: 'Active', key: 'isActive', width: 10 },
    { header: 'Created', key: 'createdAt', width: 15 },
    { header: 'Updated', key: 'updatedAt', width: 15 },
    { header: 'Last Verified', key: 'lastVerifiedDate', width: 15 },
    { header: 'Media URLs', key: 'media', width: 30 },
    { header: 'Favorited By', key: 'favoritedByUsers', width: 20 }
  ];

  worksheet.columns = columns;

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF366092' }
  };

  // Add data rows
  const flattenedProjects = projects.map(flattenProjectForExport);
  worksheet.addRows(flattenedProjects);

  // Auto-fit columns (approximate)
  worksheet.columns.forEach((col) => {
    if (col.width && col.width < 50) {
      col.width = Math.min(col.width, 50);
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
};

/**
 * Generate PDF buffer from projects using pdfkit
 * Note: requires 'pdfkit' to be installed: npm install pdfkit @types/pdfkit
 */
export const generatePdfBuffer = async (projects: any[]): Promise<Buffer> => {
  // Dynamically import pdfkit to avoid hard dependency
  let PDFDocument: any;
  try {
    const pdfkit = require('pdfkit');
    PDFDocument = pdfkit;
  } catch (error) {
    throw new Error(
      'pdfkit is not installed. Run: npm install pdfkit @types/pdfkit'
    );
  }

  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Projects Export', { align: 'center' });
    doc.moveDown();

    // Add timestamp
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Generated: ${new Date().toISOString()}`, {
        align: 'right'
      });
    doc.moveDown();

    // Table header
    const pageWidth = doc.page.width;
    const margin = 40;
    const colWidths = [40, 100, 80, 80, 80, 120]; // id, name, status, city, country, buildingType
    let x = margin;

    doc.fontSize(10).font('Helvetica-Bold');
    const headers = [
      'ID',
      'Name',
      'Status',
      'City',
      'Country',
      'Building Type'
    ];
    headers.forEach((header, i) => {
      doc.text(header, x, doc.y, { width: colWidths[i], align: 'left' });
      x += colWidths[i];
    });
    doc.moveDown();

    // Table rows
    doc.fontSize(9).font('Helvetica');
    const flattenedProjects = projects.map(flattenProjectForExport);

    flattenedProjects.forEach((project) => {
      // Check if we need a new page
      if (doc.y > doc.page.height - 50) {
        doc.addPage();
      }

      x = margin;
      const rowData = [
        String(project.id),
        String(project.name).substring(0, 30),
        String(project.status),
        String(project.city),
        String(project.country),
        String(project.buildingType)
      ];

      rowData.forEach((text, i) => {
        doc.text(text, x, doc.y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      doc.moveDown(1.2);
    });

    // Add footer
    doc
      .fontSize(9)
      .text(`Total Projects: ${projects.length}`, margin, doc.page.height - 30);

    doc.end();
  });
};
