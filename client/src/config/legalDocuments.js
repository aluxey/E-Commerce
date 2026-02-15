import agbPdf from '../assets/CGU/AGB_Onlineshop_Sabrina_Loeber_260121_192407.pdf';
import datenschutzPdf from '../assets/CGU/Datenschutzerklaerung_Sabrina_Loeber-1_260121_192311.pdf';
import impressumPdf from '../assets/CGU/Impressum_Sabrina_Loeber_260121_192428.pdf';
import widerrufPdf from '../assets/CGU/Widerrufsbelehrung_Sabrina_Loeber_260121_192338.pdf';

export const LEGAL_DOCUMENTS = [
  {
    id: 'terms',
    path: '/legal/terms',
    pdf: agbPdf,
    footerKey: 'terms',
  },
  {
    id: 'privacy',
    path: '/legal/privacy',
    pdf: datenschutzPdf,
    footerKey: 'privacy',
  },
  {
    id: 'cancellation',
    path: '/legal/cancellation',
    pdf: widerrufPdf,
    footerKey: 'withdrawal',
  },
  {
    id: 'imprint',
    path: '/legal/imprint',
    pdf: impressumPdf,
    footerKey: 'imprint',
  },
];

export const LEGAL_DOCUMENTS_BY_ID = Object.fromEntries(
  LEGAL_DOCUMENTS.map(document => [document.id, document])
);
