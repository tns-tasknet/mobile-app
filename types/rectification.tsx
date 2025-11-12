export interface Rectification {
    id?: string;
    content: string;
    reportId: string;
    memberId: string;
    createdAt: Date;
    author: {
        name: string,
        role: string,
    };
    
}