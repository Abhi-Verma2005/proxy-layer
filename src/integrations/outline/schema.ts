import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';

// Generated schema for outline
// Generated at: 2025-07-18T12:56:24.408Z
// Tables found: SequelizeMeta, apiKeys, attachments, authentication_providers, authentications, collections, comments, documents, events, file_operations, group_permissions, group_users, groups, import_tasks, imports, integrations, notifications, oauth_authentications, oauth_authorization_codes, oauth_clients, pins, reactions, relationships, revisions, search_queries, shares, stars, subscriptions, team_domains, teams, user_authentications, user_permissions, users, views, webhook_deliveries, webhook_subscriptions

export const SequelizeMeta = pgTable('SequelizeMeta', {
  name: text().notNull().primaryKey(),
});

export const apiKeys = pgTable('apiKeys', {
  id: uuid().notNull().primaryKey(),
  name: text(),
  secret: text(),
  userId: uuid(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
  expiresAt: timestamp(),
  lastActiveAt: timestamp(),
  hash: text(),
  last4: text(),
  scope: text(),
});

export const attachments = pgTable('attachments', {
  id: uuid().notNull().primaryKey(),
  teamId: uuid().notNull(),
  userId: uuid().notNull(),
  documentId: uuid(),
  key: text().notNull(),
  contentType: text().notNull(),
  size: integer().notNull(),
  acl: text().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  lastAccessedAt: timestamp(),
  expiresAt: timestamp(),
});

export const authentication_providers = pgTable('authentication_providers', {
  id: uuid().notNull().primaryKey(),
  name: text().notNull(),
  providerId: text().notNull(),
  enabled: boolean().notNull(),
  teamId: uuid().notNull(),
  createdAt: timestamp().notNull(),
});

export const authentications = pgTable('authentications', {
  id: uuid().notNull().primaryKey(),
  userId: uuid(),
  teamId: uuid(),
  service: text().notNull(),
  token: text(),
  scopes: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  refreshToken: text(),
});

export const collections = pgTable('collections', {
  id: uuid().notNull().primaryKey(),
  name: text(),
  description: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  teamId: uuid().notNull(),
  searchVector: text(),
  createdById: uuid(),
  deletedAt: timestamp(),
  urlId: text(),
  documentStructure: jsonb(),
  color: text(),
  maintainerApprovalRequired: boolean().notNull(),
  icon: text(),
  sort: jsonb(),
  sharing: boolean().notNull(),
  index: text(),
  permission: text(),
  state: text(),
  importId: uuid(),
  content: jsonb(),
  archivedAt: timestamp(),
  archivedById: uuid(),
  apiImportId: uuid(),
  commenting: boolean(),
});

export const comments = pgTable('comments', {
  id: uuid().notNull().primaryKey(),
  data: jsonb().notNull(),
  documentId: uuid().notNull(),
  parentCommentId: uuid(),
  createdById: uuid().notNull(),
  resolvedAt: timestamp(),
  resolvedById: uuid(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
  reactions: jsonb(),
});

export const documents = pgTable('documents', {
  id: uuid().notNull().primaryKey(),
  urlId: text().notNull(),
  title: text().notNull(),
  text: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  collectionId: uuid(),
  teamId: uuid(),
  parentDocumentId: uuid(),
  lastModifiedById: uuid().notNull(),
  revisionCount: integer(),
  searchVector: text(),
  deletedAt: timestamp(),
  createdById: uuid(),
  collaboratorIds: text(),
  publishedAt: timestamp(),
  pinnedById: uuid(),
  archivedAt: timestamp(),
  isWelcome: boolean().notNull(),
  editorVersion: text(),
  version: text(),
  template: boolean().notNull(),
  templateId: uuid(),
  previousTitles: text(),
  state: text(),
  fullWidth: boolean().notNull(),
  importId: uuid(),
  insightsEnabled: boolean().notNull(),
  sourceMetadata: jsonb(),
  content: jsonb(),
  summary: text(),
  icon: text(),
  color: text(),
  apiImportId: uuid(),
});

export const events = pgTable('events', {
  id: uuid().notNull().primaryKey(),
  name: text().notNull(),
  data: jsonb(),
  userId: uuid(),
  collectionId: uuid(),
  teamId: uuid(),
  createdAt: timestamp().notNull(),
  documentId: uuid(),
  actorId: uuid(),
  modelId: uuid(),
  ip: text(),
  changes: jsonb(),
  authType: text(),
});

export const file_operations = pgTable('file_operations', {
  id: uuid().notNull().primaryKey(),
  state: text().notNull(),
  type: text().notNull(),
  key: text(),
  url: text(),
  size: integer().notNull(),
  userId: uuid().notNull(),
  collectionId: uuid(),
  teamId: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  error: text(),
  format: text().notNull(),
  includeAttachments: boolean().notNull(),
  deletedAt: timestamp(),
  options: jsonb(),
});

export const group_permissions = pgTable('group_permissions', {
  collectionId: uuid(),
  groupId: uuid().notNull(),
  createdById: uuid().notNull(),
  permission: text().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
  documentId: uuid(),
  id: uuid().notNull().primaryKey(),
  sourceId: uuid(),
});

export const group_users = pgTable('group_users', {
  userId: uuid().notNull().primaryKey(),
  groupId: uuid().notNull().primaryKey(),
  createdById: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const groups = pgTable('groups', {
  id: uuid().notNull().primaryKey(),
  name: text().notNull(),
  teamId: uuid().notNull(),
  createdById: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
  externalId: text(),
});

export const import_tasks = pgTable('import_tasks', {
  id: uuid().notNull().primaryKey(),
  state: text().notNull(),
  input: jsonb().notNull(),
  output: jsonb(),
  importId: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  error: text(),
});

export const imports = pgTable('imports', {
  id: uuid().notNull().primaryKey(),
  name: text().notNull(),
  service: text().notNull(),
  state: text().notNull(),
  input: jsonb().notNull(),
  documentCount: integer().notNull(),
  integrationId: uuid().notNull(),
  createdById: uuid().notNull(),
  teamId: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
  error: text(),
});

export const integrations = pgTable('integrations', {
  id: uuid().notNull().primaryKey(),
  type: text(),
  userId: uuid(),
  teamId: uuid().notNull(),
  service: text().notNull(),
  collectionId: uuid(),
  authenticationId: uuid(),
  events: text(),
  settings: jsonb(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
  issueSources: jsonb(),
});

export const notifications = pgTable('notifications', {
  id: uuid().notNull().primaryKey(),
  actorId: uuid(),
  userId: uuid().notNull(),
  event: text(),
  createdAt: timestamp().notNull(),
  viewedAt: timestamp(),
  emailedAt: timestamp(),
  teamId: uuid().notNull(),
  documentId: uuid(),
  commentId: uuid(),
  revisionId: uuid(),
  collectionId: uuid(),
  archivedAt: timestamp(),
  membershipId: uuid(),
});

export const oauth_authentications = pgTable('oauth_authentications', {
  id: uuid().notNull().primaryKey(),
  accessTokenHash: text().notNull(),
  accessTokenExpiresAt: timestamp().notNull(),
  refreshTokenHash: text().notNull(),
  refreshTokenExpiresAt: timestamp().notNull(),
  lastActiveAt: timestamp(),
  scope: text().notNull(),
  oauthClientId: uuid().notNull(),
  userId: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
});

export const oauth_authorization_codes = pgTable('oauth_authorization_codes', {
  id: uuid().notNull().primaryKey(),
  authorizationCodeHash: text().notNull(),
  codeChallenge: text(),
  codeChallengeMethod: text(),
  scope: text().notNull(),
  oauthClientId: uuid().notNull(),
  userId: uuid().notNull(),
  redirectUri: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull(),
});

export const oauth_clients = pgTable('oauth_clients', {
  id: uuid().notNull().primaryKey(),
  name: text().notNull(),
  description: text(),
  developerName: text(),
  developerUrl: text(),
  avatarUrl: text(),
  clientId: text().notNull(),
  clientSecret: text().notNull(),
  published: boolean().notNull(),
  teamId: uuid().notNull(),
  createdById: uuid().notNull(),
  redirectUris: text().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
});

export const pins = pgTable('pins', {
  id: uuid().notNull().primaryKey(),
  documentId: uuid().notNull(),
  collectionId: uuid(),
  teamId: uuid().notNull(),
  createdById: uuid().notNull(),
  index: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const reactions = pgTable('reactions', {
  id: uuid().notNull().primaryKey(),
  emoji: text().notNull(),
  userId: uuid().notNull(),
  commentId: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const relationships = pgTable('relationships', {
  id: uuid().notNull().primaryKey(),
  userId: uuid().notNull(),
  documentId: uuid().notNull(),
  reverseDocumentId: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  type: text().notNull(),
});

export const revisions = pgTable('revisions', {
  id: uuid().notNull().primaryKey(),
  title: text().notNull(),
  text: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  userId: uuid().notNull(),
  documentId: uuid().notNull(),
  editorVersion: text(),
  version: text(),
  content: jsonb(),
  icon: text(),
  color: text(),
  name: text(),
  deletedAt: timestamp(),
});

export const search_queries = pgTable('search_queries', {
  id: uuid().notNull().primaryKey(),
  userId: uuid(),
  teamId: uuid(),
  source: text().notNull(),
  query: text().notNull(),
  results: integer().notNull(),
  createdAt: timestamp().notNull(),
  shareId: uuid(),
  score: integer(),
  answer: text(),
});

export const shares = pgTable('shares', {
  id: uuid().notNull().primaryKey(),
  userId: uuid().notNull(),
  teamId: uuid().notNull(),
  documentId: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  revokedAt: timestamp(),
  revokedById: uuid(),
  published: boolean().notNull(),
  lastAccessedAt: timestamp(),
  includeChildDocuments: boolean().notNull(),
  views: integer(),
  urlId: text(),
  domain: text(),
  allowIndexing: boolean().notNull(),
  showLastUpdated: boolean().notNull(),
});

export const stars = pgTable('stars', {
  id: uuid().notNull().primaryKey(),
  documentId: uuid(),
  userId: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  index: text(),
  collectionId: uuid(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid().notNull().primaryKey(),
  userId: uuid().notNull(),
  documentId: uuid(),
  event: text().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
  collectionId: uuid(),
});

export const team_domains = pgTable('team_domains', {
  id: uuid().notNull().primaryKey(),
  teamId: uuid().notNull(),
  createdById: uuid().notNull(),
  name: text().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const teams = pgTable('teams', {
  id: uuid().notNull().primaryKey(),
  name: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  avatarUrl: text(),
  deletedAt: timestamp(),
  sharing: boolean().notNull(),
  subdomain: text(),
  documentEmbeds: boolean().notNull(),
  guestSignin: boolean().notNull(),
  domain: text(),
  signupQueryParams: jsonb(),
  collaborativeEditing: boolean(),
  defaultUserRole: text().notNull(),
  defaultCollectionId: uuid(),
  memberCollectionCreate: boolean().notNull(),
  inviteRequired: boolean().notNull(),
  preferences: jsonb(),
  suspendedAt: timestamp(),
  lastActiveAt: timestamp(),
  memberTeamCreate: boolean().notNull(),
  approximateTotalAttachmentsSize: integer(),
  previousSubdomains: text(),
  description: text(),
});

export const user_authentications = pgTable('user_authentications', {
  id: uuid().notNull().primaryKey(),
  userId: uuid().notNull(),
  authenticationProviderId: uuid().notNull(),
  accessToken: text(),
  refreshToken: text(),
  scopes: text(),
  providerId: text().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  expiresAt: timestamp(),
  lastValidatedAt: timestamp(),
});

export const user_permissions = pgTable('user_permissions', {
  collectionId: uuid(),
  userId: uuid().notNull(),
  permission: text().notNull(),
  createdById: uuid().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  documentId: uuid(),
  index: text(),
  id: uuid().notNull().primaryKey(),
  sourceId: uuid(),
});

export const users = pgTable('users', {
  id: uuid().notNull().primaryKey(),
  email: text(),
  name: text().notNull(),
  jwtSecret: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  teamId: uuid(),
  avatarUrl: text(),
  suspendedById: uuid(),
  suspendedAt: timestamp(),
  lastActiveAt: timestamp(),
  lastActiveIp: text(),
  lastSignedInAt: timestamp(),
  lastSignedInIp: text(),
  deletedAt: timestamp(),
  lastSigninEmailSentAt: timestamp(),
  language: text(),
  flags: jsonb(),
  invitedById: uuid(),
  preferences: jsonb(),
  notificationSettings: jsonb().notNull(),
  role: text().notNull(),
  timezone: text(),
});

export const views = pgTable('views', {
  id: uuid().notNull().primaryKey(),
  documentId: uuid().notNull(),
  userId: uuid().notNull(),
  count: integer().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  lastEditingAt: timestamp(),
});

export const webhook_deliveries = pgTable('webhook_deliveries', {
  id: uuid().notNull().primaryKey(),
  webhookSubscriptionId: uuid().notNull(),
  status: text().notNull(),
  statusCode: integer(),
  requestBody: jsonb(),
  requestHeaders: jsonb(),
  responseBody: text(),
  responseHeaders: jsonb(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const webhook_subscriptions = pgTable('webhook_subscriptions', {
  id: uuid().notNull().primaryKey(),
  teamId: uuid().notNull(),
  createdById: uuid().notNull(),
  url: text().notNull(),
  enabled: boolean().notNull(),
  name: text().notNull(),
  events: text().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
  secret: text(),
});

