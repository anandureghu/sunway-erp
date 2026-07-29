export interface Goal {
  id: number;
  kpi: string;
  description: string;
  weight: number;
  active: boolean;
}

export interface CycleConfig {
  id?: number;
  appraisalYear: string;
  appraisalName: string;
  startMonth: string;
  endMonth: string;
  minGoals: number;
  maxGoals: number;
  enableSelfAssessment: boolean;
  enableMidYear: boolean;
  enablePIP: boolean;
  status: string;
}

export interface RatingScale {
  score: number;
  label: string;
  definition: string;
}

export interface Phase {
  id: string;
  label: string;
  icon: string;
  description: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
}

export interface EmployeeAppraisal {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeRole: string;
  year: number;
  status: string;
  overallScore?: number | null;
  goals: GoalWithRating[];
  employeeComments?: string;
  managerComments?: string;
}

export interface GoalWithRating {
  goalId: number;
  kpi: string;
  description: string;
  weight: number;
  selfRating: number | null | undefined;
  managerRating: number | null | undefined;
  selfComment: string;
  managerComment: string;
}
