export interface Report {
  data: {
    report: {
      id?: number;
      title: string;
      content: string;
      status: string;
      createdAt: string; 
      updatedAt: string;
      closedAt: string | null;
      startedAt: string | null;
      latitude: number | null;
      longitude: number | null;
      deviceId: string | null;
      response: string; 
      memberId: string;
      organizationId: string;
      assignee: Record<string, any>; 
      activities: any[]; 
      materials: any[]; 
    };
  };
  error: any | null;
}
