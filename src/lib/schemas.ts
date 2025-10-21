import { z } from 'zod'

export const roleSchema = z.enum(['1st-tenor', '2nd-tenor', 'baritone', 'bass'])

export const songSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  defaultRole: roleSchema.optional(),
  parts: z.record(roleSchema, z.string()),
  lyrics: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
})

export const songsDataSchema = z.object({
  meta: z.object({
    version: z.number(),
    updatedAt: z.string(),
  }),
  songs: z.array(songSchema),
})

export type Role = z.infer<typeof roleSchema>
export type Song = z.infer<typeof songSchema>
export type SongsData = z.infer<typeof songsDataSchema>
