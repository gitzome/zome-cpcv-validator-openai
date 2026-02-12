export enum UploadType {
  OWNER = 'OWNER',
  BUYER = 'BUYER',
  PROPERTY = 'PROPERTY',
  CPCV = 'CPCV'
}

export interface UploadedFile {
  id: string;
  file: File;
  type: UploadType;
  previewUrl: string;
}

export interface Discrepancy {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  field: string;
  sourceDocValue: string;
  cpcvValue: string;
  description: string;
}

export interface ValidationReport {
  overallStatus: 'VALID' | 'INVALID' | 'REVIEW_NEEDED';
  summary: string;
  entities: {
    owners: { status: 'MATCH' | 'MISMATCH' | 'MISSING'; notes: string };
    buyers: { status: 'MATCH' | 'MISMATCH' | 'MISSING'; notes: string };
    property: { status: 'MATCH' | 'MISMATCH' | 'MISSING'; notes: string };
  };
  discrepancies: Discrepancy[];
  missingDocumentsData: string[];
  detailedComparison: {
    owners: ComparisonItem[];
    buyers: ComparisonItem[];
    property: ComparisonItem[];
  };
}

export interface ComparisonItem {
  field: string;
  sourceValue: string;
  cpcvValue: string;
  status: 'MATCH' | 'MISMATCH' | 'MISSING_SOURCE' | 'MISSING_CPCV';
}
