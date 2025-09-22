import { db } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  declared_interests: any[];
  created_at?: string;
  last_active?: string;
  updated_at?: string;
}

export const UsersTable = 'users';

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return db<User>(UsersTable).where({ email }).first();
}

export async function findUserById(id: string): Promise<User | undefined> {
  return db<User>(UsersTable).where({ id }).first();
}

export async function createUser(email: string, password_hash: string, declared_interests: any[] = []): Promise<User> {
  const id = uuidv4();
  const [user] = await db<User>(UsersTable)
    .insert({ 
      id, 
      email, 
      password_hash, 
      declared_interests: JSON.stringify(declared_interests) 
    })
    .returning('*');
  return user;
}

export async function updateLastActive(id: string): Promise<void> {
  await db<User>(UsersTable).where({ id }).update({ last_active: db.fn.now(), updated_at: db.fn.now() });
}
