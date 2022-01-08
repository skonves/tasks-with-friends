import React, { useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { ChevronRightIcon, PlusIcon } from '@heroicons/react/solid';
import { Link } from 'react-router-dom';

import { Page } from '../../templates/page';
import {
  GetTasksQuery,
  GetTasksQuery_tasks_nodes,
} from './__generated__/GetTasksQuery';
import { useProfile } from '../../profile-provider';
import { ParticipantResponse } from '../../../__generated__/globalTypes';
import { useTaskModal } from '../../components/task-modal';

export const GET_TASKS = gql`
  query GetTasksQuery {
    tasks(filter: ALL) {
      nodes {
        id
        name
        description
        status
        durationMinutes
        groupSize
        owner {
          id
          name
          avatarUrl
        }
        participants(first: 100) {
          nodes {
            id
            response
            user {
              id
              name
              avatarUrl
            }
          }
        }
      }
    }
  }
`;

const CreateTaskButton: React.VFC<{ className?: string }> = ({ className }) => (
  <Link
    to="/tasks/new"
    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
      !!className ? className : ''
    }`}
  >
    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
    New Task
  </Link>
);

const TaskItem: React.VFC<{ task: GetTasksQuery_tasks_nodes }> = ({ task }) => {
  const { TaskModal, open } = useTaskModal();

  const profile = useProfile();

  const me = useMemo(
    () => task.participants.nodes.find((p) => p.user.id === profile.id),
    [profile.id, task.participants.nodes],
  );

  return (
    <>
      <li key={task.id}>
        <a onClick={open} className="cursor-pointer block hover:bg-gray-50">
          <div className="px-4 py-4 flex items-center sm:px-6">
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="truncate">
                <div className="flex text-sm">
                  <p className="font-medium text-indigo-600 truncate">
                    {task.name}
                    {!!me?.response && (
                      <span
                        className={`uppercase ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  ${
                          me.response === ParticipantResponse.YES
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {me.response}
                      </span>
                    )}
                  </p>
                  <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                    {task.groupSize === 1
                      ? 'Just me'
                      : `${task.groupSize} of us`}{' '}
                    for {task.durationMinutes}m
                  </p>
                </div>
                <div className="mt-2 flex">
                  <div className="flex items-center text-sm text-gray-500">
                    <p>{task.description}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                <div className="flex overflow-hidden -space-x-1">
                  {task.participants.nodes.map((node) => (
                    <img
                      key={node.user.id}
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                      src={node.user.avatarUrl || ''}
                      alt={node.user.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="ml-5 flex-shrink-0">
              <ChevronRightIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
          </div>
        </a>
      </li>
      <TaskModal task={task} />
    </>
  );
};

const TasksGuts: React.VFC = () => {
  const { loading, error, data } = useQuery<GetTasksQuery>(GET_TASKS);

  if (loading) return <>Loading...</>;
  if (error) return <>Error loading.</>;

  if (!data?.tasks?.nodes?.length) {
    return (
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 mt-12 md:mt-24 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new task.
        </p>
        <div className="mt-6">
          <CreateTaskButton />
        </div>
      </div>
    );
  }

  return (
    <>
      <CreateTaskButton className="mb-4" />
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {data?.tasks?.nodes.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      </div>
    </>
  );
};

export const Tasks: React.VFC = () => {
  return (
    <Page title="Tasks">
      <TasksGuts />
    </Page>
  );
};
