export interface Review {
    Cycle: string;
    Batch: string;
    BatchReleaseDate: string;
    ReviewType: string;
    Grade: string; 
  }
  export interface UniversityData {
    Title: string;
    Program: string;
    UnifiedStudyField: string; 
    Reviews: Review[];
    AverageGrade: number;
      }
      