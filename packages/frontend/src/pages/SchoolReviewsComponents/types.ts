

export interface Review {
  Cycle: string;
  Batch: string;
  BatchReleaseDate: string;
  ReviewType: string;
  Grade: string; 
}

export interface SchoolData {
  InstitutionCode: string;
  EnglishSchoolName: string;
  ArabicSchoolName: string;
  SchoolType: string; 
  Reviews: Review[];
  AverageGrade: number;
  SchoolLevel?: string;   // Optional: "Primary", "Intermediate", "Secondary"
  SchoolGender?: string;  // Optional: "Boys", "Girls"
}
