

export interface Review {
    Cycle: string;
    Batch: string;
    BatchReleaseDate: string;
    ReviewType: string;
    Grade: string; 
  }
  
  export interface VocationalData {
    InstitutionCode: string;
    EnglishInstituteName: string;
    ArabicInstituteName: string; 
    Reviews: Review[];
    AverageGrade: number;
  }
  