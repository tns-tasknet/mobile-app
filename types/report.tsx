export interface Report {
  id: string;
  title: string;
  content: string;
  organizationId: string;
  memberId: string;
  response: string | null;
  status: string;

  createdAt: string;
  updatedAt: string | null;

  metadata : {
    name: string;
    updatedAt: string | null;
    deviceId?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }

  startedAt?: string | null;
  closedAt?: string | null;

  activities: string[];
  materials: string[];

  signature: string | null;
  evidence: string[] | null;

  assignee?: {
    user:{
    id: string,
    name: string,
    role: string,
    email?: string,
    }
  };

}
