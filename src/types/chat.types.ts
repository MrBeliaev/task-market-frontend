import type { EthAddress, TaskDbId } from './common.types';

export interface TaskMessage {
  id: number;
  taskId: TaskDbId;
  sender: EthAddress;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
}
