import { pb } from '../lib/pocketbase';

export const supabase = {
  from: (collectionName: string) => ({
    select: (query?: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          try {
            const records = await pb.collection(collectionName).getList(1, 1, {
              filter: `${column} = "${value}"`,
            });
            if (records.items.length === 0) return { data: null, error: { message: 'Not found' } };
            return { data: records.items[0], error: null };
          } catch (err: any) {
            return { data: null, error: err };
          }
        },
        order: (column: string, opts?: { ascending?: boolean }) => ({
          limit: async (count: number) => {
            try {
              const records = await pb.collection(collectionName).getList(1, count, {
                filter: `${column} = "${value}"`,
                sort: `${opts?.ascending === false ? '-' : ''}${column}`
              });
              return { data: records.items, error: null };
            } catch (err: any) {
              return { data: [], error: err };
            }
          },
          catch: (fn: any) => Promise.resolve({ data: [], error: null }).catch(fn),
          then: (resolve: any, reject: any) => {
            pb.collection(collectionName).getList(1, 100, {
              filter: `${column} = "${value}"`,
              sort: `${opts?.ascending === false ? '-' : ''}${column}`
            }).then(res => resolve({ data: res.items, error: null })).catch(err => resolve({ data: [], error: err }));
          }
        }),
        catch: (fn: any) => Promise.resolve({ data: [], error: null }).catch(fn),
        then: (resolve: any, reject: any) => {
          pb.collection(collectionName).getList(1, 100, {
            filter: `${column} = "${value}"`
          }).then(res => resolve({ data: res.items, error: null })).catch(err => resolve({ data: [], error: err }));
        }
      }),
      order: (column: string, opts?: { ascending?: boolean }) => ({
        limit: async (count: number) => {
          try {
            const records = await pb.collection(collectionName).getList(1, count, {
              sort: `${opts?.ascending === false ? '-' : ''}${column}`
            });
            return { data: records.items, error: null };
          } catch (err: any) {
            return { data: [], error: err };
          }
        },
        catch: (fn: any) => Promise.resolve({ data: [], error: null }).catch(fn),
        then: (resolve: any, reject: any) => {
          pb.collection(collectionName).getList(1, 500, {
            sort: `${opts?.ascending === false ? '-' : ''}${column}`
          }).then(res => resolve({ data: res.items, error: null })).catch(err => resolve({ data: [], error: err }));
        }
      }),
      catch: (fn: any) => Promise.resolve({ data: [], error: null }).catch(fn),
      then: (resolve: any, reject: any) => {
        pb.collection(collectionName).getList(1, 500)
          .then(res => resolve({ data: res.items, error: null }))
          .catch(err => resolve({ data: [], error: err }));
      }
    }),
    insert: (payload: any) => ({
      select: () => ({
        single: async () => {
          try {
            const record = await pb.collection(collectionName).create(payload);
            return { data: record, error: null };
          } catch (err: any) {
            return { data: null, error: err };
          }
        }
      }),
      catch: (fn: any) => Promise.resolve({ data: null, error: null }).catch(fn),
      then: (resolve: any, reject: any) => {
        pb.collection(collectionName).create(payload)
          .then(res => resolve({ data: res, error: null }))
          .catch(err => resolve({ data: null, error: err }));
      }
    }),
    upsert: (payload: any) => ({
      select: () => ({
        then: (resolve: any, reject: any) => {
          pb.collection(collectionName).create(payload)
            .then(res => resolve({ data: res, error: null }))
            .catch(err => resolve({ data: null, error: err }));
        }
      }),
      catch: (fn: any) => Promise.resolve({ data: null, error: null }).catch(fn),
      then: (resolve: any, reject: any) => {
        pb.collection(collectionName).create(payload)
          .then(res => resolve({ data: res, error: null }))
          .catch(err => resolve({ data: null, error: err }));
      }
    }),
    update: (payload: any) => ({
      eq: (column: string, value: any) => ({
        catch: (fn: any) => Promise.resolve({ data: null, error: null }).catch(fn),
        then: async (resolve: any) => {
          try {
            const list = await pb.collection(collectionName).getList(1, 1, { filter: `${column} = "${value}"` });
            if (list.items.length > 0) {
              const updated = await pb.collection(collectionName).update(list.items[0].id, payload);
              resolve({ data: updated, error: null });
            } else {
              resolve({ data: null, error: { message: 'Not found' } });
            }
          } catch (err: any) {
            resolve({ data: null, error: err });
          }
        }
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        catch: (fn: any) => Promise.resolve({ data: null, error: null }).catch(fn),
        then: async (resolve: any) => {
          try {
            const list = await pb.collection(collectionName).getList(1, 1, { filter: `${column} = "${value}"` });
            if (list.items.length > 0) {
              await pb.collection(collectionName).delete(list.items[0].id);
              resolve({ data: null, error: null });
            } else {
              resolve({ data: null, error: { message: 'Not found' } });
            }
          } catch (err: any) {
            resolve({ data: null, error: err });
          }
        }
      })
    })
  }),
  auth: {
    getSession: async () => {
      return { data: { session: pb.authStore.isValid ? { user: pb.authStore.model } : null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      callback(pb.authStore.isValid ? 'SIGNED_IN' : 'SIGNED_OUT', pb.authStore.isValid ? { user: pb.authStore.model } : null);
      const unsubscribe = pb.authStore.onChange((token, model) => {
        callback(model ? 'SIGNED_IN' : 'SIGNED_OUT', model ? { user: model } : null);
      });
      return { data: { subscription: { unsubscribe } } };
    },
    signInWithPassword: async ({ email, password }: any) => {
      try {
        const authData = await pb.collection('users').authWithPassword(email, password);
        return { data: { user: authData.record, session: authData }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: err };
      }
    },
    signUp: async ({ email, password, options }: any) => {
      try {
        const data = { email, password, passwordConfirm: password, ...options?.data };
        const record = await pb.collection('users').create(data);
        await pb.collection('users').authWithPassword(email, password);
        return { data: { user: record, session: pb.authStore }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: err };
      }
    },
    signOut: async () => {
      pb.authStore.clear();
      return { error: null };
    }
  }
};
