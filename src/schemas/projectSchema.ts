import { z } from 'zod';

export const ProjectSchema = z.object({
  name: z.string().default(''),

  buildingType: z.enum([
    'Skyscraper',
    'High-rise',
    'Major civic or commercial building',
    'Industrial building'
  ]),

  buildingUse: z
    .array(
      z.enum([
        'office',
        'residential',
        'mixed-use',
        'hotel',
        'hospital',
        'education',
        'retail',
        'cultural',
        'industrial',
        'logistics',
        'data_center',
        'other'
      ])
    )
    .default([]),

  buildingHeightMeters: z.number().nullable().default(null),
  buildingHeightFloors: z.number().nullable().default(null),

  glassFacade: z.enum(['yes', 'no']).nullable().default(null),

  facadeBasis: z
    .enum([
      'renderings',
      'construction_photos',
      'architectural_specs',
      'mixed',
      'unknown'
    ])
    .default('unknown'),

  projectBudgetEur: z.number().nullable().default(null),

  location: z.object({
    city: z.string().default(''),
    address: z.string().default(''),
    metroArea: z.string().default(''),
    country: z.string().default(''),
    continent: z.string().default(''),
    postcode: z.string().default(''),
    coordinates: z.object({
      latitude: z.number().nullable().default(null),
      longitude: z.number().nullable().default(null)
    })
  }),

  projectWebsites: z.array(z.string()).default([]),

  status: z.enum([
    'planned',
    'approved',
    'proposed',
    'under_construction',
    'on_hold',
    'completed'
  ]),

  expectedCompletionWindow: z.object({
    expected: z.string().default(''),
    earliest: z.string().default(''),
    latest: z.string().default(''),
    sourceBasis: z
      .enum([
        'developer',
        'contractor',
        'planning',
        'database',
        'media',
        'inferred'
      ])
      .default('inferred')
  }),

  developers: z
    .array(
      z.object({
        name: z.string().default(''),
        website: z.string().default(''),
        contact: z.object({
          email: z.string().default(''),
          phone: z.string().default('')
        }),
        source: z.string().default('')
      })
    )
    .default([]),

  architects: z
    .array(
      z.object({
        name: z.string().default(''),
        website: z.string().default(''),
        contact: z.object({
          email: z.string().default(''),
          phone: z.string().default('')
        }),
        source: z.string().default('')
      })
    )
    .default([]),

  contractors: z
    .array(
      z.object({
        name: z.string().default(''),
        website: z.string().default(''),
        contact: z.object({
          email: z.string().default(''),
          phone: z.string().default('')
        }),
        source: z.string().default('')
      })
    )
    .default([]),

  media: z
    .array(
      z.object({
        title: z.string().default(''),
        url: z.string().default(''), // direct image url or ""
        sourcePage: z.string().default(''),
        mediaType: z.string().default('')
      })
    )
    .default([]),

  sources: z
    .array(
      z.object({
        url: z.string().default(''),
        sourceType: z
          .enum([
            'developer',
            'architect',
            'planning',
            'database',
            'media',
            'other'
          ])
          .default('other'),
        publisher: z.string().default(''),
        accessedAt: z.string().default('')
      })
    )
    .default([]),

  lastVerifiedDate: z.string().default(''),
  confidenceScore: z.enum(['Low', 'Medium', 'High']).default('Low')
});

export const ProjectsEnvelopeSchema = z.object({
  projects: z.array(ProjectSchema).default([])
});
