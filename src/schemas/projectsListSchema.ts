import { z } from 'zod';

const ProjectsListSchema = z.object({
  projects: z
    .array(
      z.object({
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

        address: z.string().default(''),
        city: z.string().default(''),
        metroArea: z.string().default(''),
        country: z.string().default(''),
        continent: z.string().default(''),
        buildingHeightMeters: z.number().nullable().default(null),

        status: z.enum([
          'planned',
          'approved',
          'proposed',
          'under_construction',
          'on_hold',
          'completed',
          'pre_construction'
        ]),

        expectedDateText: z.string().default(''),

        sources: z
          .array(
            z.object({
              publisher: z.string().default(''),
              url: z.string().default('')
            })
          )
          .default([]),

        lastVerifiedDate: z.string().default('')
      })
    )
    .default([])
});

export type ProjectsEnvelope = z.infer<typeof ProjectsListSchema>;

export default ProjectsListSchema;
