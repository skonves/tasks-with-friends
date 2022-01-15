import { Response } from 'node-fetch';
import { TaskStatus, UserStatus } from '../domain/v1/api.g';

export interface RealTime {
  trigger<EventName extends keyof EventMap>(
    channel: string | string[],
    event: EventName,
    data: EventMap[EventName],
  ): Promise<Response>;

  // triggerBatch(events: AnyBatchEvent[]): Promise<Response>;
}

// // TODO: make this more specific
// export type AnyBatchEvent = BatchEvent<keyof EventMap>;

// export type BatchEvent<EventName extends keyof EventMap> = {
//   channel: string;
//   name: EventName;
//   data: EventMap[EventName];
// };

export type EventMap = {
  'task-status:v1': {
    taskIds: string[];
  };
  'user-status:v1': {
    userIds: string[];
  };
  'multi-payload:v1': {
    userStatus?: Record<string, UserStatus>;
    taskStatus?: Record<string, TaskStatus>;
  };
};
