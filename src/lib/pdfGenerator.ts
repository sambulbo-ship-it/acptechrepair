import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface RentalContractData {
  // Company info
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  
  // Client info
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  
  // Machine info
  machineName: string;
  machineBrand?: string;
  machineModel?: string;
  machineSerialNumber?: string;
  machineCategory: string;
  
  // Rental info
  startDate: string;
  expectedEndDate?: string;
  agreedPrice: number;
  depositAmount?: number;
  currency: string;
  notes?: string;
  
  // Pricing info
  dailyPrice?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  
  // Meta
  contractNumber: string;
  language: 'fr' | 'en';
}

const translations = {
  fr: {
    title: 'CONTRAT DE LOCATION',
    contractNumber: 'Contrat N°',
    date: 'Date',
    lessor: 'LOUEUR',
    lessee: 'LOCATAIRE',
    name: 'Nom',
    company: 'Société',
    email: 'Email',
    phone: 'Téléphone',
    address: 'Adresse',
    equipmentDetails: 'DÉTAILS DE L\'ÉQUIPEMENT',
    equipmentName: 'Désignation',
    brand: 'Marque',
    model: 'Modèle',
    serialNumber: 'N° de série',
    category: 'Catégorie',
    rentalTerms: 'CONDITIONS DE LOCATION',
    startDate: 'Date de début',
    endDate: 'Date de fin prévue',
    duration: 'Durée',
    pricing: 'TARIFICATION',
    dailyRate: 'Tarif journalier',
    weeklyRate: 'Tarif hebdomadaire',
    monthlyRate: 'Tarif mensuel',
    agreedPrice: 'Prix convenu',
    deposit: 'Caution',
    notes: 'NOTES',
    terms: 'CONDITIONS GÉNÉRALES',
    termsText: [
      '1. Le locataire s\'engage à utiliser le matériel avec soin et à le restituer dans l\'état où il l\'a reçu.',
      '2. Toute détérioration ou perte sera à la charge du locataire.',
      '3. Le matériel reste la propriété exclusive du loueur pendant toute la durée de la location.',
      '4. La caution sera restituée après vérification du matériel lors de la restitution.',
      '5. En cas de retard de paiement, des pénalités pourront être appliquées.',
    ],
    signatures: 'SIGNATURES',
    lessorSignature: 'Le Loueur',
    lesseeSignature: 'Le Locataire',
    generatedOn: 'Document généré le',
  },
  en: {
    title: 'RENTAL CONTRACT',
    contractNumber: 'Contract No.',
    date: 'Date',
    lessor: 'LESSOR',
    lessee: 'LESSEE',
    name: 'Name',
    company: 'Company',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    equipmentDetails: 'EQUIPMENT DETAILS',
    equipmentName: 'Description',
    brand: 'Brand',
    model: 'Model',
    serialNumber: 'Serial No.',
    category: 'Category',
    rentalTerms: 'RENTAL TERMS',
    startDate: 'Start date',
    endDate: 'Expected end date',
    duration: 'Duration',
    pricing: 'PRICING',
    dailyRate: 'Daily rate',
    weeklyRate: 'Weekly rate',
    monthlyRate: 'Monthly rate',
    agreedPrice: 'Agreed price',
    deposit: 'Deposit',
    notes: 'NOTES',
    terms: 'GENERAL TERMS',
    termsText: [
      '1. The lessee agrees to use the equipment with care and return it in the condition received.',
      '2. Any damage or loss will be the responsibility of the lessee.',
      '3. The equipment remains the exclusive property of the lessor during the rental period.',
      '4. The deposit will be returned after inspection of the equipment upon return.',
      '5. Late payment penalties may apply.',
    ],
    signatures: 'SIGNATURES',
    lessorSignature: 'Lessor',
    lesseeSignature: 'Lessee',
    generatedOn: 'Document generated on',
  },
};

export function generateRentalContractPDF(data: RentalContractData): jsPDF {
  const t = translations[data.language];
  const dateLocale = data.language === 'fr' ? fr : enUS;
  const doc = new jsPDF();
  
  let yPos = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  
  // Helper function to add text
  const addText = (text: string, x: number, y: number, options?: { align?: 'left' | 'center' | 'right'; fontSize?: number; fontStyle?: 'normal' | 'bold' }) => {
    doc.setFontSize(options?.fontSize || 10);
    doc.setFont('helvetica', options?.fontStyle || 'normal');
    doc.text(text, x, y, { align: options?.align });
    return y;
  };
  
  // Helper to draw a line
  const drawLine = (y: number) => {
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    return y + 5;
  };
  
  // Title
  doc.setFillColor(30, 30, 46);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  addText(t.title, pageWidth / 2, 20, { align: 'center', fontSize: 20, fontStyle: 'bold' });
  addText(`${t.contractNumber}: ${data.contractNumber}`, pageWidth / 2, 30, { align: 'center', fontSize: 10 });
  
  doc.setTextColor(0, 0, 0);
  yPos = 55;
  
  // Contract date
  addText(`${t.date}: ${format(new Date(), 'PPP', { locale: dateLocale })}`, pageWidth - margin, yPos, { align: 'right', fontSize: 9 });
  yPos += 15;
  
  // Two columns: Lessor and Lessee
  const colWidth = contentWidth / 2 - 10;
  
  // Lessor (Company)
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos - 5, colWidth, 45, 'F');
  addText(t.lessor, margin + 5, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  addText(data.companyName, margin + 5, yPos, { fontSize: 10, fontStyle: 'bold' });
  yPos += 6;
  if (data.companyAddress) {
    addText(data.companyAddress, margin + 5, yPos, { fontSize: 9 });
    yPos += 5;
  }
  if (data.companyPhone) {
    addText(`${t.phone}: ${data.companyPhone}`, margin + 5, yPos, { fontSize: 9 });
    yPos += 5;
  }
  if (data.companyEmail) {
    addText(`${t.email}: ${data.companyEmail}`, margin + 5, yPos, { fontSize: 9 });
  }
  
  // Reset yPos for second column
  yPos = 70;
  const col2X = margin + colWidth + 20;
  
  // Lessee (Client)
  doc.setFillColor(245, 245, 245);
  doc.rect(col2X, yPos - 5, colWidth, 45, 'F');
  addText(t.lessee, col2X + 5, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 8;
  addText(data.clientName || '-', col2X + 5, yPos, { fontSize: 10, fontStyle: 'bold' });
  yPos += 6;
  if (data.clientCompany) {
    addText(`${t.company}: ${data.clientCompany}`, col2X + 5, yPos, { fontSize: 9 });
    yPos += 5;
  }
  if (data.clientPhone) {
    addText(`${t.phone}: ${data.clientPhone}`, col2X + 5, yPos, { fontSize: 9 });
    yPos += 5;
  }
  if (data.clientEmail) {
    addText(`${t.email}: ${data.clientEmail}`, col2X + 5, yPos, { fontSize: 9 });
  }
  
  yPos = 125;
  yPos = drawLine(yPos);
  
  // Equipment Details
  addText(t.equipmentDetails, margin, yPos, { fontSize: 12, fontStyle: 'bold' });
  yPos += 10;
  
  const equipmentData = [
    [t.equipmentName, data.machineName],
    [t.brand, data.machineBrand || '-'],
    [t.model, data.machineModel || '-'],
    [t.serialNumber, data.machineSerialNumber || '-'],
    [t.category, data.machineCategory],
  ];
  
  equipmentData.forEach(([label, value]) => {
    addText(`${label}:`, margin + 5, yPos, { fontSize: 9 });
    addText(value, margin + 60, yPos, { fontSize: 9, fontStyle: 'bold' });
    yPos += 6;
  });
  
  yPos += 5;
  yPos = drawLine(yPos);
  
  // Rental Terms
  addText(t.rentalTerms, margin, yPos, { fontSize: 12, fontStyle: 'bold' });
  yPos += 10;
  
  addText(`${t.startDate}:`, margin + 5, yPos, { fontSize: 9 });
  addText(format(new Date(data.startDate), 'PPP', { locale: dateLocale }), margin + 60, yPos, { fontSize: 9, fontStyle: 'bold' });
  yPos += 6;
  
  if (data.expectedEndDate) {
    addText(`${t.endDate}:`, margin + 5, yPos, { fontSize: 9 });
    addText(format(new Date(data.expectedEndDate), 'PPP', { locale: dateLocale }), margin + 60, yPos, { fontSize: 9, fontStyle: 'bold' });
    yPos += 6;
  }
  
  yPos += 5;
  yPos = drawLine(yPos);
  
  // Pricing
  addText(t.pricing, margin, yPos, { fontSize: 12, fontStyle: 'bold' });
  yPos += 10;
  
  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat(data.language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: data.currency,
    }).format(price);
  };
  
  if (data.dailyPrice) {
    addText(`${t.dailyRate}:`, margin + 5, yPos, { fontSize: 9 });
    addText(formatPrice(data.dailyPrice), margin + 60, yPos, { fontSize: 9 });
    yPos += 6;
  }
  if (data.weeklyPrice) {
    addText(`${t.weeklyRate}:`, margin + 5, yPos, { fontSize: 9 });
    addText(formatPrice(data.weeklyPrice), margin + 60, yPos, { fontSize: 9 });
    yPos += 6;
  }
  if (data.monthlyPrice) {
    addText(`${t.monthlyRate}:`, margin + 5, yPos, { fontSize: 9 });
    addText(formatPrice(data.monthlyPrice), margin + 60, yPos, { fontSize: 9 });
    yPos += 6;
  }
  
  yPos += 3;
  doc.setFillColor(249, 115, 22);
  doc.rect(margin, yPos - 4, contentWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  addText(`${t.agreedPrice}: ${formatPrice(data.agreedPrice)}`, margin + 5, yPos + 3, { fontSize: 11, fontStyle: 'bold' });
  doc.setTextColor(0, 0, 0);
  yPos += 15;
  
  if (data.depositAmount) {
    addText(`${t.deposit}:`, margin + 5, yPos, { fontSize: 9 });
    addText(formatPrice(data.depositAmount), margin + 60, yPos, { fontSize: 9, fontStyle: 'bold' });
    yPos += 10;
  }
  
  // Notes
  if (data.notes) {
    yPos = drawLine(yPos);
    addText(t.notes, margin, yPos, { fontSize: 12, fontStyle: 'bold' });
    yPos += 8;
    const splitNotes = doc.splitTextToSize(data.notes, contentWidth - 10);
    doc.setFontSize(9);
    doc.text(splitNotes, margin + 5, yPos);
    yPos += splitNotes.length * 5 + 5;
  }
  
  // Check if we need a new page for terms and signatures
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }
  
  // Terms
  yPos = drawLine(yPos);
  addText(t.terms, margin, yPos, { fontSize: 12, fontStyle: 'bold' });
  yPos += 8;
  
  doc.setFontSize(8);
  t.termsText.forEach((term) => {
    const splitTerm = doc.splitTextToSize(term, contentWidth - 10);
    doc.text(splitTerm, margin + 5, yPos);
    yPos += splitTerm.length * 4 + 2;
  });
  
  // Check if we need a new page for signatures
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  yPos += 10;
  yPos = drawLine(yPos);
  
  // Signatures
  addText(t.signatures, margin, yPos, { fontSize: 12, fontStyle: 'bold' });
  yPos += 15;
  
  // Signature boxes
  const sigBoxWidth = colWidth - 10;
  const sigBoxHeight = 30;
  
  doc.rect(margin, yPos, sigBoxWidth, sigBoxHeight);
  addText(t.lessorSignature, margin + 5, yPos + 5, { fontSize: 9 });
  
  doc.rect(col2X, yPos, sigBoxWidth, sigBoxHeight);
  addText(t.lesseeSignature, col2X + 5, yPos + 5, { fontSize: 9 });
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`${t.generatedOn} ${format(new Date(), 'PPpp', { locale: dateLocale })}`, pageWidth / 2, footerY, { align: 'center' });
  
  return doc;
}

export function downloadRentalContract(data: RentalContractData) {
  const doc = generateRentalContractPDF(data);
  const fileName = `contrat-location-${data.contractNumber}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
