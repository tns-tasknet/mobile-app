export interface Message {
    id?: string;
    content: string;
    tags: string[],
    orderId: string;
    memberId: string;
    createdAt: string;
    author: {
        name: string,
        role: string,
    };
    
}