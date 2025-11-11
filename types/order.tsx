interface Order {
  id: number;
  title: string;
  content: string;
  status: "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  response?: string;
  logo?: string;
  slugText?: string;
  metadata?: any;
}