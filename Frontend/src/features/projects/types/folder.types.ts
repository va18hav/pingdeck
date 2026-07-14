export interface Folder {
    id: string;
    name: string;
    projectId: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
}
