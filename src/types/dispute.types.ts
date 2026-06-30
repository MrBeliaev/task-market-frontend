import type { EthAddress, TaskDbId } from './common.types';

export interface DisputeMessage {
  id: number;
  taskId: TaskDbId;
  sender: EthAddress;
  isAdmin: boolean;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
}
