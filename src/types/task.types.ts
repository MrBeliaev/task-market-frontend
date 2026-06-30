import type { EthAddress, TaskDbId } from './common.types';

export type TaskStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface Application {
  id: number;
  taskId: TaskDbId;
  applicant: EthAddress;
  message: string;
  createdAt: string;
}

export interface Comment {
  id: number;
  taskId: TaskDbId;
  author: EthAddress;
  content: string;
  createdAt: string;
}

export interface TaskResponse {
  id: TaskDbId;
  onChainId: number;
  chainId: number;
  client: EthAddress;
  executor: EthAddress | null;
  reward: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  status: TaskStatus;
  metadataHash: string;
  title: string;
  description: string;
  contactInfo: string;
  referenceLink: string | null;
  category: string | null;
  skills: string[];
  clientConfirmed: boolean;
  executorConfirmed: boolean;
  _count?: { applications: number; comments: number };
  applications?: Application[];
  comments?: Comment[];
}

export interface PaginatedResponse {
  tasks: TaskResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
