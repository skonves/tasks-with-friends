import { Client, Expr, query as q } from 'faunadb';

export class FaunaUtils {
  constructor(private readonly fauna: Client) {}

  async provision(): Promise<void> {
    const { collections, indexes } = await this.fauna.query<{
      collections: string[];
      indexes: string[];
    }>({
      collections: q.Select(
        'data',
        q.Map(
          q.Paginate(q.Collections()),
          q.Lambda('doc', q.Select('id', q.Var('doc'))),
        ),
      ),
      indexes: q.Select(
        'data',
        q.Map(
          q.Paginate(q.Indexes()),
          q.Lambda('doc', q.Select('id', q.Var('doc'))),
        ),
      ),
    });

    const expressions: Expr[] = [];

    if (!collections.includes('users')) {
      expressions.push(
        q.CreateCollection({
          name: 'users',
          history_days: 30,
          ttl_days: null,
        }),
      );
    }

    if (!collections.includes('invitations')) {
      expressions.push(
        q.CreateCollection({
          name: 'invitations',
          history_days: 30,
          ttl_days: null,
        }),
      );
    }

    if (!collections.includes('paticipants')) {
      expressions.push(
        q.CreateCollection({
          name: 'paticipants',
          history_days: 30,
          ttl_days: null,
        }),
      );
    }

    if (!collections.includes('tasks')) {
      expressions.push(
        q.CreateCollection({
          name: 'tasks',
          history_days: 30,
          ttl_days: null,
        }),
      );
    }

    if (!indexes.includes('invitations_by_fromUser')) {
      expressions.push(
        q.CreateIndex({
          name: 'invitations_by_fromUser',
          unique: false,
          serialized: true,
          source: q.Collection('invitations'),
          terms: [
            {
              field: ['data', 'fromUser'],
            },
          ],
          values: [
            {
              field: ['ref'],
            },
            {
              field: ['data', 'invitedEmail'],
            },
            {
              field: ['data', 'fromUser'],
            },
          ],
        }),
      );
    }

    if (!indexes.includes('invitations_by_invitedEmail')) {
      expressions.push(
        q.CreateIndex({
          name: 'invitations_by_invitedEmail',
          unique: false,
          serialized: true,
          source: q.Collection('invitations'),
          terms: [
            {
              field: ['data', 'invitedEmail'],
            },
          ],
          values: [
            {
              field: ['ref'],
            },
            {
              field: ['data', 'invitedEmail'],
            },
            {
              field: ['data', 'fromUser'],
            },
          ],
        }),
      );
    }

    if (!indexes.includes('users_by_provider_and_providerUserId')) {
      expressions.push(
        q.CreateIndex({
          name: 'users_by_provider_and_providerUserId',
          unique: true,
          serialized: true,
          source: q.Collection('users'),
          terms: [
            {
              field: ['data', 'provider'],
            },
            {
              field: ['data', 'providerUserId'],
            },
          ],
        }),
      );
    }

    if (!indexes.includes('tasks_by_owner')) {
      expressions.push(
        q.CreateIndex({
          name: 'tasks_by_owner',
          unique: false,
          serialized: true,
          source: q.Collection('tasks'),
          terms: [
            {
              field: ['data', 'owner'],
            },
          ],
        }),
      );
    }

    if (!indexes.includes('paticipants_by_task')) {
      expressions.push(
        q.CreateIndex({
          name: 'paticipants_by_task',
          unique: false,
          serialized: true,
          source: q.Collection('participants'),
          terms: [
            {
              field: ['data', 'task'],
            },
          ],
        }),
      );
    }

    if (!indexes.includes('paticipants_by_user')) {
      expressions.push(
        q.CreateIndex({
          name: 'paticipants_by_user',
          unique: false,
          serialized: true,
          source: q.Collection('participants'),
          terms: [
            {
              field: ['data', 'user'],
            },
          ],
        }),
      );
    }

    if (!indexes.includes('participants_by_user_with_task')) {
      expressions.push(
        q.CreateIndex({
          name: 'participants_by_user_with_task',
          unique: false,
          serialized: true,
          source: q.Collection('participants'),
          terms: [
            {
              field: ['data', 'user'],
            },
          ],
          values: [
            {
              field: ['data', 'task'],
            },
          ],
        }),
      );
    }

    if (expressions.length) {
      for (const expr of expressions) {
        await this.fauna.query(expr);
      }
    }
  }

  async clearAll(): Promise<void> {
    const { collections } = await this.fauna.query<{
      collections: string[];
    }>({
      collections: q.Select(
        'data',
        q.Map(
          q.Paginate(q.Collections()),
          q.Lambda('doc', q.Select('id', q.Var('doc'))),
        ),
      ),
    });

    for (const collection of collections) {
      await this.fauna.query(
        q.Map(
          q.Paginate(q.Documents(q.Collection(collection)), { size: 9999 }),
          q.Lambda(['ref'], q.Delete(q.Var('ref'))),
        ),
      );
    }
  }
}
