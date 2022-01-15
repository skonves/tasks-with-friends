import React, { useEffect } from 'react';
import Pusher, { Channel } from 'pusher-js';

import { useProfileOrNull } from '../profile-provider';
import { EventMap } from '../services/real-time';
import { gql, useApolloClient } from '@apollo/client';
import { GET_DASHBOARD } from '../pages/app';
import { GetDashboardQuery } from '../pages/__generated__/GetDashboardQuery';
import {
  WriteTaskStatus,
  WriteTaskStatusVariables,
} from './__generated__/WriteTaskStatus';
import { TaskStatus, UserStatus } from '../../__generated__/globalTypes';

import * as domain from '../domain/v1/api.g';
import {
  WriteUserStatus,
  WriteUserStatusVariables,
} from './__generated__/WriteUserStatus';

const WRITE_TASK_STATUS = gql`
  query WriteTaskStatus($taskId: ID!) {
    task(id: $taskId) {
      id
      status
    }
  }
`;

const WRITE_USER_STATUS = gql`
  query WriteUserStatus($userId: ID!) {
    user(id: $userId) {
      id
      status
    }
  }
`;

export const RealTimeProvider: React.FC = ({ children }) => {
  const profile = useProfileOrNull();
  const client = useApolloClient();

  useEffect(() => {
    if (profile) {
      const pusher = new Pusher('a1aa8e926f8ea7877532', {
        cluster: 'us3',
      });

      const channel = pusher.subscribe(profile.id);

      handleEvent(
        channel,
        'multi-payload:v1',
        ({ taskStatus = {}, userStatus = {} }) => {
          for (const taskId of Object.keys(taskStatus)) {
            client.writeQuery<WriteTaskStatus, WriteTaskStatusVariables>({
              query: WRITE_TASK_STATUS,
              data: {
                task: {
                  __typename: 'Task',
                  id: taskId,
                  status: mapTaskStatus(taskStatus[taskId]),
                },
              },
              variables: { taskId },
            });
          }

          for (const userId of Object.keys(userStatus)) {
            client.writeQuery<WriteUserStatus, WriteUserStatusVariables>({
              query: WRITE_USER_STATUS,
              data: {
                user: {
                  __typename: 'User',
                  id: userId,
                  status: mapUserStatus(userStatus[userId]),
                },
              },
              variables: { userId },
            });
          }

          if (
            Object.keys(taskStatus).length &&
            userStatus[profile?.id || ''] !== 'flow'
          ) {
            client.query<GetDashboardQuery>({
              query: GET_DASHBOARD,
              fetchPolicy: 'network-only',
            });
          }
        },
      );

      // handleEvent(channel, 'task-status:v1', ({ taskIds }) => {
      //   for (const taskId of taskIds) {
      //     client.query<RecacheTaskStatusQuery, RecacheTaskStatusQueryVariables>(
      //       {
      //         query: RECACHE_TASK_STATUS,
      //         fetchPolicy: 'network-only',
      //         variables: { taskId },
      //       },
      //     );
      //   }
      //   client.query<GetDashboardQuery>({
      //     query: GET_DASHBOARD,
      //     fetchPolicy: 'network-only',
      //   });
      // });

      // handleEvent(channel, 'user-status:v1', ({ userIds }) => {
      //   for (const userId of userIds) {
      //     client.query<RecacheUserStatusQuery, RecacheUserStatusQueryVariables>(
      //       {
      //         query: RECACHE_USER_STATUS,
      //         fetchPolicy: 'network-only',
      //         variables: { userId },
      //       },
      //     );
      //   }
      // });

      return () => {
        channel.unsubscribe();
      };
    } else {
      return () => {
        // empty
      };
    }
  }, [profile, client]);
  return <>{children}</>;
};

function handleEvent<EventName extends keyof EventMap>(
  channel: Channel,
  eventName: EventName,
  callback: (data: EventMap[EventName]) => void,
) {
  channel.bind(eventName, callback);
}

function mapTaskStatus(status: domain.TaskStatus): TaskStatus {
  switch (status) {
    case 'waiting':
      return TaskStatus.WAITING;
    case 'ready':
      return TaskStatus.READY;
    case 'in-progress':
      return TaskStatus.IN_PROGRESS;
    case 'done':
      return TaskStatus.DONE;
  }
}

function mapUserStatus(status: domain.UserStatus): UserStatus {
  switch (status) {
    case 'away':
      return UserStatus.AWAY;
    case 'idle':
      return UserStatus.IDLE;
    case 'flow':
      return UserStatus.FLOW;
  }
}
