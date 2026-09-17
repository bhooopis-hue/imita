import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const clients = sqliteTable('clients', {
 id:text('id').primaryKey(), owner:text('owner').notNull(), name:text('name').notNull(), email:text('email').notNull(), company:text('company').notNull().default(''), created:text('created').notNull()
}, t=>[index('clients_owner').on(t.owner)]);
export const projects = sqliteTable('projects', {
 id:text('id').primaryKey(), owner:text('owner').notNull(), clientId:text('client_id').notNull().references(()=>clients.id), title:text('title').notNull(), description:text('description').notNull().default(''), due:text('due').notNull(), status:text('status').notNull().default('production'), created:text('created').notNull()
}, t=>[index('projects_owner').on(t.owner)]);
export const tasks = sqliteTable('tasks', {
 id:text('id').primaryKey(), projectId:text('project_id').notNull().references(()=>projects.id), title:text('title').notNull(), done:integer('done').notNull().default(0), created:text('created').notNull()
},t=>[index('tasks_project').on(t.projectId)]);
export const deliveries = sqliteTable('deliveries', {
 id:text('id').primaryKey(), projectId:text('project_id').notNull().references(()=>projects.id), title:text('title').notNull(), url:text('url').notNull(), note:text('note').notNull().default(''), reviewer:text('reviewer').notNull(), status:text('status').notNull().default('review'), token:text('token').notNull().unique(), created:text('created').notNull()
},t=>[index('deliveries_project').on(t.projectId)]);
export const comments = sqliteTable('comments', {
 id:text('id').primaryKey(), deliveryId:text('delivery_id').notNull().references(()=>deliveries.id), author:text('author').notNull(), body:text('body').notNull(), decision:text('decision').notNull().default('comment'), created:text('created').notNull()
},t=>[index('comments_delivery').on(t.deliveryId)]);
