export interface Message {
    id?: string;
    organizationId?: string;
    text: string;
    content?: string;
    tags: string[];
    orderId?: string;
    memberId?: string;
    createdAt?: string;
    name?: string,
    role?: string,
    sender?: {
        user: {
            email: string,
            image: string | null,
            name: string,
            role: string,
        }
        userId: string,
    }

}
