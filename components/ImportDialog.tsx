"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  EMoURecord,
  DepartmentCode,
  EMoUStatus,
  DocumentAvailability,
} from "@/types";

interface ImportDialogProps {
  onImport: (records: Partial<EMoURecord>[]) => Promise<void>;
  onClose: () => void;
}

interface ValidationResult {
  valid: Partial<EMoURecord>[];
  invalid: Array<{
    row: number;
    data: Record<string, unknown>;
    missingFields: string[];
  }>;
}

export default function ImportDialog({ onImport, onClose }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = [
    "companyName",
    "department",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null);
    }
  };

  // Intelligent date parser supporting multiple formats
  const parseDate = (dateValue: unknown): string => {
    if (!dateValue) return "";
    
    const dateStr = String(dateValue).trim();
    if (!dateStr) return "";

    // Try parsing as Excel serial date
    if (!isNaN(Number(dateStr)) && Number(dateStr) > 1000) {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + Number(dateStr) * 86400000);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }

    // Common date separators: ., /, -
    const patterns = [
      /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/, // DD.MM.YYYY or DD/MM/YY
      /^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{2,4})$/, // DD Month YYYY
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern);
      if (match) {
        let day: string, month: string, year: string;
        
        if (pattern === patterns[1]) { // YYYY-MM-DD
          [, year, month, day] = match;
        } else if (pattern === patterns[2]) { // DD Month YYYY
          [, day, month, year] = match;
          const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const monthIndex = monthNames.findIndex(m => month.toLowerCase().startsWith(m));
          month = String(monthIndex + 1).padStart(2, '0');
        } else { // DD.MM.YYYY or DD/MM/YY
          [, day, month, year] = match;
        }

        // Handle 2-digit years
        if (year.length === 2) {
          year = Number(year) > 50 ? `19${year}` : `20${year}`;
        }

        // Normalize
        day = String(day).padStart(2, '0');
        month = String(month).padStart(2, '0');
        
        return `${day}.${month}.${year}`;
      }
    }

    // Try native Date parsing as last resort
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      }
    } catch (e) {
      // Ignore
    }

    return dateStr; // Return as-is if can't parse
  };

  // Normalize status values (case-insensitive) or auto-determine from dates
  const normalizeStatus = (status: unknown, toDateStr?: string): EMoUStatus => {
    const statusStr = String(status || "").trim().toLowerCase();
    
    // If status is provided, use it
    if (statusStr) {
      if (statusStr.includes("active")) return "Active";
      if (statusStr.includes("expire")) return "Expired";
      if (statusStr.includes("renew")) return "Renewal Pending";
      if (statusStr.includes("draft")) return "Draft";
    }
    
    // If status is empty, auto-determine from toDate
    if (toDateStr) {
      try {
        const parts = toDateStr.split('.');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
          const year = parseInt(parts[2]);
          const toDate = new Date(year, month, day);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time for date-only comparison
          
          if (toDate >= today) {
            return "Active";
          } else {
            return "Expired";
          }
        }
      } catch (e) {
        // If date parsing fails, default to Draft
      }
    }
    
    return "Draft"; // Default
  };

  // Normalize department codes
  const normalizeDepartment = (dept: unknown): DepartmentCode => {
    const deptStr = String(dept || "").trim().toUpperCase();
    const deptMapping: Record<string, DepartmentCode> = {
      "CSE": "CSE", "COMPUTER": "CSE", "CS": "CSE",
      "ECE": "ECE", "ELECTRONICS": "ECE", "EC": "ECE",
      "EEE": "EEE", "ELECTRICAL": "EEE", "EE": "EEE",
      "MECH": "MECH", "MECHANICAL": "MECH", "ME": "MECH",
      "CIVIL": "CIVIL", "CE": "CIVIL",
      "IT": "IT", "INFORMATION": "IT",
      "AIDS": "AIDS", "AI&DS": "AIDS", "AI": "AIDS",
      "CSBS": "CSBS",
    };
    
    // Try exact match first
    if (deptMapping[deptStr]) return deptMapping[deptStr];
    
    // Try partial match
    for (const [key, value] of Object.entries(deptMapping)) {
      if (deptStr.includes(key)) return value;
    }
    
    return "CSE"; // Default
  };

  // Normalize document availability
  const normalizeDocAvailability = (doc: unknown): DocumentAvailability => {
    const docStr = String(doc || "").trim().toLowerCase();
    if (docStr.includes("available") || docStr.includes("yes") || docStr.includes("soft") || docStr.includes("hard")) return "Available";
    return "Not Available"; // Default
  };

  // Normalize yes/no fields
  const normalizeYesNo = (value: unknown): "Yes" | "No" => {
    const valStr = String(value || "").trim().toLowerCase();
    if (valStr.includes("yes") || valStr === "y" || valStr === "1" || valStr === "true") return "Yes";
    return "No";
  };

  const parseExcelFile = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      validateAndParseRecords(jsonData);
    };
    reader.readAsBinaryString(file);
  };

  const validateAndParseRecords = (data: unknown[]) => {
    const valid: Partial<EMoURecord>[] = [];
    const invalid: Array<{
      row: number;
      data: Record<string, unknown>;
      missingFields: string[];
    }> = [];

    data.forEach((row, index) => {
      const record = row as Record<string, unknown>;
      const missingFields: string[] = [];

      // Check ONLY essential required fields (companyName and department)
      requiredFields.forEach((field) => {
        if (!record[field] || String(record[field]).trim() === "") {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        invalid.push({
          row: index + 2, // +2 because Excel is 1-indexed and row 1 is header
          data: record,
          missingFields,
        });
      } else {
        // Map Excel columns to EMoURecord fields with intelligent parsing
        const fromDate = parseDate(record.fromDate) || "";
        const toDate = parseDate(record.toDate) || "";
        
        const emouRecord: Partial<EMoURecord> = {
          department: normalizeDepartment(record.department),
          companyName: String(record.companyName || "").trim(),
          fromDate: fromDate,
          toDate: toDate,
          status: normalizeStatus(record.status, toDate),
          description: String(record.description || "").trim(),
          documentAvailability: normalizeDocAvailability(record.documentAvailability),
          goingForRenewal: normalizeYesNo(record.goingForRenewal),
          perStudentCost: record.perStudentCost && !isNaN(Number(record.perStudentCost))
            ? Number(record.perStudentCost)
            : 0,
          placementOpportunity: record.placementOpportunity && !isNaN(Number(record.placementOpportunity))
            ? Number(record.placementOpportunity)
            : 0,
          internshipOpportunity: record.internshipOpportunity && !isNaN(Number(record.internshipOpportunity))
            ? Number(record.internshipOpportunity)
            : 0,
          companyRelationship: record.companyRelationship && !isNaN(Number(record.companyRelationship))
            ? Math.max(1, Math.min(5, Number(record.companyRelationship))) as 1 | 2 | 3 | 4 | 5
            : 3,
        };

        // Only add optional fields if they have values (avoid undefined)
        if (record.scannedCopy && String(record.scannedCopy).trim()) {
          emouRecord.scannedCopy = String(record.scannedCopy).trim();
        }
        if (record.companyWebsite && String(record.companyWebsite).trim()) {
          emouRecord.companyWebsite = String(record.companyWebsite).trim();
        }
        if (record.aboutCompany && String(record.aboutCompany).trim()) {
          emouRecord.aboutCompany = String(record.aboutCompany).trim();
        }
        if (record.companyAddress && String(record.companyAddress).trim()) {
          emouRecord.companyAddress = String(record.companyAddress).trim();
        }
        if (record.industryContactName && String(record.industryContactName).trim()) {
          emouRecord.industryContactName = String(record.industryContactName).trim();
        }
        if (record.industryContactMobile && String(record.industryContactMobile).trim()) {
          emouRecord.industryContactMobile = String(record.industryContactMobile).trim();
        }
        if (record.industryContactEmail && String(record.industryContactEmail).trim()) {
          emouRecord.industryContactEmail = String(record.industryContactEmail).trim();
        }
        if (record.institutionContactName && String(record.institutionContactName).trim()) {
          emouRecord.institutionContactName = String(record.institutionContactName).trim();
        }
        if (record.institutionContactMobile && String(record.institutionContactMobile).trim()) {
          emouRecord.institutionContactMobile = String(record.institutionContactMobile).trim();
        }
        if (record.institutionContactEmail && String(record.institutionContactEmail).trim()) {
          emouRecord.institutionContactEmail = String(record.institutionContactEmail).trim();
        }
        if (record.clubsAligned && String(record.clubsAligned).trim()) {
          emouRecord.clubsAligned = String(record.clubsAligned).trim();
        }
        if (record.sdgGoals && String(record.sdgGoals).trim()) {
          emouRecord.sdgGoals = String(record.sdgGoals).trim();
        }
        if (record.skillsTechnologies && String(record.skillsTechnologies).trim()) {
          emouRecord.skillsTechnologies = String(record.skillsTechnologies).trim();
        }
        if (record.benefitsAchieved && String(record.benefitsAchieved).trim()) {
          emouRecord.benefitsAchieved = String(record.benefitsAchieved).trim();
        }

        valid.push(emouRecord);
      }
    });

    setValidationResult({ valid, invalid });
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;

    setImporting(true);
    try {
      await onImport(validationResult.valid);
      onClose();
    } catch {
      alert("Failed to import records");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#d1d5db]">
          <h2 className="text-xl font-semibold text-[#1f2937]">
            Import eMoU Records from Excel
          </h2>
          <p className="text-sm text-[#6b7280] mt-1">
            Upload an Excel file (.xlsx) with eMoU records
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-[#1f2937] mb-2">
              Select Excel File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="text-xs text-[#6b7280] mt-2">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* Required Fields Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1f2937] mb-2">
              Required Excel Columns:
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#4b5563]">
              {requiredFields.map((field) => (
                <div key={field}>• {field}</div>
              ))}
            </div>
            <div className="mt-3 text-xs text-[#4b5563]">
              <strong>Smart Import Features:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Accepts dates in any format (12.02.2021, 23/3/22, 2021-03-15)</li>
                <li>Auto-determines status from toDate if status field is empty</li>
                <li>Case-insensitive status (EXPIRED, Expired, expired)</li>
                <li>Auto-detects departments (CSE, Computer, CS → CSE)</li>
                <li>Missing fields are filled with defaults</li>
              </ul>
            </div>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-4">
              {/* Valid Records */}
              {validationResult.valid.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">
                    ✓ Valid Records: {validationResult.valid.length}
                  </h3>
                  <p className="text-xs text-green-700">
                    These records will be imported successfully.
                  </p>
                </div>
              )}

              {/* Invalid Records */}
              {validationResult.invalid.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-orange-800 mb-2">
                    ⚠ Invalid Records: {validationResult.invalid.length}
                  </h3>
                  <p className="text-xs text-orange-700 mb-3">
                    These records have missing required fields and will be
                    skipped:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {validationResult.invalid.map((item) => (
                      <div
                        key={item.row}
                        className="bg-white p-3 rounded border border-orange-200 text-xs"
                      >
                        <div className="font-semibold text-orange-900">
                          Row {item.row}:{" "}
                          {String(item.data.companyName || "Unnamed Company")}
                        </div>
                        <div className="text-orange-700 mt-1">
                          Missing fields: {item.missingFields.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[#d1d5db] flex justify-between">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={importing}
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {!validationResult && (
              <button
                onClick={parseExcelFile}
                className="btn btn-primary"
                disabled={!file}
              >
                Validate File
              </button>
            )}
            {validationResult && validationResult.valid.length > 0 && (
              <button
                onClick={handleImport}
                className="btn btn-primary"
                disabled={importing}
              >
                {importing
                  ? "Importing..."
                  : `Import ${validationResult.valid.length} Record${validationResult.valid.length > 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
