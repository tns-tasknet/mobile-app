export interface Order {
  id?: string;
  title: string;
  content: string;
  organizationId: string;
  memberId: string;
  response: string | null;
  status: "PENDING" | 'SCHEDULED' | "IN_PROGRESS" | "COMPLETED";

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

  signature?: string | null;
  evidence?: string[] | null;

  assignee?: {
    id: string;
    name: string;
    role: string;
    email?: string;
  };

}
