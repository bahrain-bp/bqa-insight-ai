
      export interface Review {
        Title: string;
        Program: string;
        UnifiedStudyField: string;
        Cycle: string;
        Type: string;
        Judgement: string;
        ReportFile: string;
      }
      
      export interface UniversityData {
        InstitutionCode: string;
        InstitutionName: string;
        Reviews: Review[];
        AverageJudgement?: number;
      }
      
      

      