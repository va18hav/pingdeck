import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const createEndpointSchema = z.object({
  name: z.string().min(1, 'Endpoint name is required').max(100, 'Endpoint name must be less than 100 characters'),
  url: z.string().url('Invalid URL format').max(2048, 'URL is too long'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).optional().default('GET'),
  projectId: z.string().uuid('Invalid Project ID format'),
  folderId: z.string().uuid('Invalid Folder ID format').optional().nullable(),
  sslVerification: z.boolean().default(true).optional(),
  
  // Prevent OOM attacks by limiting the number of headers
  headers: z.record(z.string().max(1000, 'Header value too long'))
    .refine(val => Object.keys(val).length <= 50, 'Too many headers')
    .optional().nullable(),
    
  // Prevent database bloat/crashes by limiting payload size to 100KB
  body: z.string().max(100000, 'Body payload is too large').optional().nullable(),
  
  // Prevent OOM attacks by limiting the number of query params
  queryParams: z.record(z.string().max(1000, 'Query param value too long'))
    .refine(val => Object.keys(val).length <= 50, 'Too many query params')
    .optional().nullable(),
    
  // Strictly enforce the structure of the auth object
  auth: z.discriminatedUnion('type', [
    z.object({ type: z.literal('none') }),
    z.object({ type: z.literal('bearer'), token: z.string().max(5000, 'Token too long') }),
    z.object({ type: z.literal('basic'), username: z.string().max(500), password: z.string().max(500) }),
    z.object({ type: z.literal('apiKey'), key: z.string().max(200), value: z.string().max(5000), in: z.enum(['header', 'query']) }),
    z.object({
      type: z.literal('cookie'),
      loginConfig: z.object({
        url: z.string().max(2048).optional().nullable().or(z.literal('')),
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).optional(),
        headers: z.record(z.string().max(1000)).optional().nullable(),
        body: z.string().max(100000).optional().nullable()
      }).optional().nullable()
    })
  ]).optional().nullable(),
});

export const updateEndpointSchema = z.object({
  name: z.string().min(1, 'Endpoint name is required').max(100, 'Endpoint name must be less than 100 characters').optional(),
  url: z.string().url('Invalid URL format').max(2048, 'URL is too long').optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).optional(),
  folderId: z.string().uuid('Invalid Folder ID format').optional().nullable(),
  sslVerification: z.boolean().default(true).optional(),
  headers: z.record(z.string().max(1000, 'Header value too long'))
    .refine(val => Object.keys(val).length <= 50, 'Too many headers')
    .optional().nullable(),
  body: z.string().max(100000, 'Body payload is too large').optional().nullable(),
  queryParams: z.record(z.string().max(1000, 'Query param value too long'))
    .refine(val => Object.keys(val).length <= 50, 'Too many query params')
    .optional().nullable(),
  auth: z.union([
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('none') }),
      z.object({ type: z.literal('bearer'), token: z.string().max(5000, 'Token too long') }),
      z.object({ type: z.literal('basic'), username: z.string().max(500), password: z.string().max(500) }),
      z.object({ type: z.literal('apiKey'), key: z.string().max(200), value: z.string().max(5000), in: z.enum(['header', 'query']) }),
      z.object({
        type: z.literal('cookie'),
        loginConfig: z.object({
          url: z.string().max(2048).optional().nullable().or(z.literal('')),
          method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).optional(),
          headers: z.record(z.string().max(1000)).optional().nullable(),
          body: z.string().max(100000).optional().nullable()
        }).optional().nullable()
      })
    ]),
    z.null()
  ]).optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name too long'),
  projectId: z.string().uuid('Invalid Project ID format'),
  parentId: z.string().uuid('Invalid Parent Folder ID').optional().nullable(),
});

export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;

export const createMonitorSchema = z.object({
  endpointId: z.string().uuid('Invalid Endpoint ID format'),
  interval: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number()
      .int('Interval must be a whole number')
      .min(1, 'Minimum check interval is 1 minute')
      .max(1440, 'Maximum check interval is 1440 minutes (24 hours)')
  ),
});

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
