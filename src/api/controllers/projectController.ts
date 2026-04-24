import { validationResult } from 'express-validator';

import {
  deleteProject,
  getAllProjects,
  getFavoritedProjects,
  getAllProjectsSimple,
  getProjectSimple,
  getProject,
  getProjectCount,
  getStatuses,
  getProjectsBySearchTerm,
  getProjectNamesByMetroAreaAndBuildingType,
  getAllProjectCoordinates,
  getProjectNamesByCountry
} from '../models/projectModel';

import { Request, Response, NextFunction } from 'express';
import { PostProject, Project } from '../../interfaces/Project';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import {
  findProjectIdByKey,
  parseFilters,
  throwIfValidationErrors,
  toCamel
} from '../../utils/utilities';
import { User } from '../../interfaces/User';

import { addNewProjectToDB } from '../../utils/applyEnrichedDataToProject';
import updateProjectWithAudit from '../../utils/updateProjectWithAudit';
import { ProjectDuplicate } from '../../interfaces/ProjectDuplicate';
import { postProjectDuplicate } from '../models/projectDuplicateModel';
import { deleteProjectArchitect } from '../models/projectArchitectModel';
import { deleteProjectDeveloper } from '../models/projectDeveloperModel';
import { deleteProjectContractor } from '../models/projectContractorModel';
import { deleteProjectConsultant } from '../models/projectConstultantModel';
import { deleteProjectMedia } from '../models/projectMediaModel';
import {
  deleteUserProjectFavorite,
  postUserProjectFavorite
} from '../models/userProjectFavoriteModel';

const projectListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);

    const parsedFilters = parseFilters(req);

    // Validate limit and page query parameters
    const MAX_LIMIT = 100;
    let limit = Number(req.query.limit) || 50;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * (limit ?? 50);

    const rows = await getAllProjects(
      parsedFilters.sortBy,
      parsedFilters.order === 'desc' ? 'DESC' : 'ASC',
      Object.keys(parsedFilters.filters).length > 0
        ? parsedFilters.filters
        : undefined,
      limit,
      offset
    );
    const projects = rows.map((row) => toCamel(row));
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

const projectListGetSimple = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);

    const parsedFilters = parseFilters(req);
    // Validate limit and page query parameters
    const MAX_LIMIT = 200;
    let limit = Number(req.query.limit) || 100;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * (limit ?? 50);

    const rows = await getAllProjectsSimple(
      parsedFilters.sortBy,
      parsedFilters.order === 'desc' ? 'DESC' : 'ASC',
      Object.keys(parsedFilters.filters).length > 0
        ? parsedFilters.filters
        : undefined,
      limit,
      offset
    );
    const projects = rows.map((row) => toCamel(row));
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

const projectFavoritedListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getFavoritedProjects();
    const projects = rows.map((row) => toCamel(row));
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

const projectsGetByMetroAreaAndBuildingType = async (
  req: Request<{ metroAreaId: number; buildingTypeId: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);

    const metroAreaId = req.params.metroAreaId;
    const buildingTypeId = req.params.buildingTypeId;

    if (!metroAreaId || !buildingTypeId) {
      throw new CustomError(
        'Metro area ID and building type ID are required',
        400
      );
    }

    const projects = await getProjectNamesByMetroAreaAndBuildingType(
      metroAreaId,
      buildingTypeId
    );
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

const projectsGetByCountry = async (
  req: Request<{ countryId: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const countryId = req.params.countryId;
    if (!countryId) {
      throw new CustomError('Country ID is required', 400);
    }
    const projects = await getProjectNamesByCountry(countryId);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

const searchProjectsBySearchTerm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const searchTerm = req.query.q as string;
    if (!searchTerm) {
      throw new CustomError('Search term is required', 400);
    }
    const allProjects = await getProjectsBySearchTerm(searchTerm);
    const projects = allProjects.map((row) => toCamel(row));
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

const projectGetSimple = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = toCamel(await getProjectSimple(req.params.id as number));
    res.json(project);
  } catch (err) {
    next(err);
  }
};

const projectGetCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);

    const parsedFilters = parseFilters(req);
    // Pass filters directly, allowing arrays for IN clause
    const count = await getProjectCount(
      Object.keys(parsedFilters.filters).length > 0
        ? parsedFilters.filters
        : undefined
    );
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

const projectGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const project = toCamel(await getProject(req.params.id as number));
    res.json(project);
  } catch (err) {
    next(err);
  }
};

const projectStatusesGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const statuses = await getStatuses();
    res.json(statuses);
  } catch (err) {
    next(err);
  }
};

const projectsListGetCoordinates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const coordinates = await getAllProjectCoordinates();
    res.json(coordinates);
  } catch (err) {
    next(err);
  }
};

const projectGetFormatted = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const project = toCamel(await getProject(req.params.id as number));
    //formatted response
    const formattedProject = {
      id: project.id,
      name: project.name,
      buildingHeightMeters: project.buildingHeightMeters,
      buildingHeightFloors: project.buildingHeightFloors,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      location: {
        addressId: project.addressId,
        address: project.address.address,
        city: project.address.city.name,
        country: project.address.country.name,
        metroArea: project.address.metroArea.name,
        postcode: project.address.postcode,
        coordinates: project.address.location
      },
      expectedCompletionWindow: {
        expected: project.expectedDateText,
        earliest: project.earliestDateText,
        latest: project.latestDateText
      },
      buildingType: project.buildingType,
      buildingUses: project.buildingUses?.map((bu: any) => ({
        buildingUse: bu.buildingUse,
        buildingUseId: bu.id
      })),
      budgetEur: project.budgetEur,
      glassFacade: project.glassFacade,
      facadeBasis: project.facadeBasis,
      status: project.status,
      lastVerifiedDate: project.lastVerifiedDate,
      confidenceScore: project.confidenceScore,
      isActive: project.isActive,
      projectWebsites: project.projectWebsites,
      checkedAt: project.checkedAt,
      checkedBy: project.checkedBy,
      checkedByUsername: project.checkedByUsername,
      developers:
        project.developers?.map((dev: any) => ({
          name: dev.name,
          website: dev.contact?.website ?? dev.website,
          source: dev.source,
          contact: {
            phone: dev.contact?.phone ?? dev.phone,
            email: dev.contact?.email ?? dev.email
          }
        })) || [],
      architects:
        project.architects?.map((arch: any) => ({
          id: arch.id,
          name: arch.name,
          website: arch.contact?.website ?? arch.website,
          source: arch.source,
          contact: {
            phone: arch.contact?.phone ?? arch.phone,
            email: arch.contact?.email ?? arch.email
          }
        })) || [],
      contractors:
        project.contractors?.map((cont: any) => ({
          id: cont.id,
          name: cont.name,
          source: cont.source,
          website: cont.contact?.website ?? cont.website,
          contact: {
            phone: cont.contact?.phone ?? cont.phone,
            email: cont.contact?.email ?? cont.email
          }
        })) || [],
      consultants:
        project.consultants?.map((cons: any) => ({
          id: cons.id,
          name: cons.name,
          source: cons.source,
          website: cons.contact?.website ?? cons.website,
          contact: {
            phone: cons.contact?.phone ?? cons.phone,
            email: cons.contact?.email ?? cons.email
          }
        })) || [],
      media: project.projectMedias,
      sources: project.sourceLinks,
      favoritedByUsers: project.favoritedByUsers
    };

    res.json(formattedProject);
  } catch (err) {
    next(err);
  }
};

const projectPost = async (
  req: Request<{}, {}, PostProject>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const createdProjectIds: number[] = [];
    const skippedProjects: string[] = [];
    for (const proj of req.body.projects || []) {
      const projectKey: string =
        proj.name.trim().toLowerCase() +
        '|' +
        proj.location?.city.trim().toLowerCase() +
        '|' +
        proj.location?.country.trim().toLowerCase();

      const existingProjectId = await findProjectIdByKey(projectKey);
      console.log('Existing project ID:', existingProjectId);
      if (existingProjectId && existingProjectId.score < 0.3) {
        skippedProjects.push(projectKey);
        const projectDuplicate: ProjectDuplicate = {
          projectDuplicateName: proj.name,
          projectDuplicateKey: projectKey,
          matchedProjectId: existingProjectId.id,
          projectDuplicateData: JSON.stringify(proj),
          reason: 'Duplicate project key',
          similarityScore: existingProjectId.score * 100
        };
        console.log('similarity score: ', projectDuplicate.similarityScore);
        await postProjectDuplicate(projectDuplicate);
        continue;
      }
      const project = await addNewProjectToDB(proj, 'manual');

      if (project) {
        createdProjectIds.push(project.projectId as number);
      }
    }

    const response: MessageResponse = {
      message: `Created ${createdProjectIds.length} projects${skippedProjects.length > 0 ? `, skipped ${skippedProjects.length} duplicates` : ''}`,
      ids: createdProjectIds,
      skipped: skippedProjects.length > 0 ? skippedProjects : undefined
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

const projectFavoritePost = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as User;
    const projectId = req.params.id;

    const success = await postUserProjectFavorite({
      userId: user.id,
      projectId: projectId
    });
    console.log('POST favorite .', success);
    if (success) {
      const response: MessageResponse = {
        message: 'Project favorited successfully',
        id: projectId
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const projectFavoriteDelete = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as User;
    const projectId = req.params.id;
    const success = await deleteUserProjectFavorite(user.id, projectId);
    if (success) {
      const response: MessageResponse = {
        message: 'Project unfavorited successfully',
        id: projectId
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

const projectPut = async (
  req: Request<{ id: number }, {}, PostProject>,
  res: Response,
  next: NextFunction
) => {
  try {
    // const user = req.user as User;
    // if (user.role !== 'admin') {
    //   throw new CustomError('Unauthorized', 401);
    // }

    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    if (req.body.removals) {
      console.log('Deleting properties:', req.body.removals);
      try {
      } catch (error) {}
      if (req.body.removals.developers) {
        for (
          let i = 0;
          i < ((req.body.removals.developers ?? []) as unknown[]).length;
          i++
        ) {
          try {
            const developerId = (req.body.removals.developers as unknown[])[
              i
            ] as number;
            console.log('developerId to be removed', developerId);
            if (!developerId) {
              throw new CustomError('Invalid developer ID', 400);
            }
            await deleteProjectDeveloper(req.params.id, developerId);
          } catch (error) {
            console.error('Error deleting developer:', error);
            throw error; // Rethrow to be caught by outer catch
          }
        }
      } else if (req.body.removals.architects) {
        for (
          let i = 0;
          i < ((req.body.removals.architects ?? []) as unknown[]).length;
          i++
        ) {
          try {
            const architectId = (req.body.removals.architects as unknown[])[
              i
            ] as number;
            console.log('architectId to be removed', architectId);
            if (!architectId) {
              throw new CustomError('Invalid architect ID', 400);
            }
            await deleteProjectArchitect(req.params.id, architectId);
          } catch (error) {
            console.error('Error deleting architect:', error);
            throw error; // Rethrow to be caught by outer catch
          }
        }
      } else if (req.body.removals.contractors) {
        for (
          let i = 0;
          i < ((req.body.removals.contractors ?? []) as unknown[]).length;
          i++
        ) {
          try {
            const contractorId = (req.body.removals.contractors as unknown[])[
              i
            ] as number;
            console.log('contractorId to be removed', contractorId);
            if (!contractorId) {
              throw new CustomError('Invalid contractor ID', 400);
            }
            await deleteProjectContractor(req.params.id, contractorId);
          } catch (error) {
            console.error('Error deleting contractor:', error);
            throw error; // Rethrow to be caught by outer catch
          }
        }
      } else if (req.body.removals.consultants) {
        for (
          let i = 0;
          i < ((req.body.removals.consultants ?? []) as unknown[]).length;
          i++
        ) {
          try {
            const consultantId = (req.body.removals.consultants as unknown[])[
              i
            ] as number;
            console.log('consultantId to be removed', consultantId);
            if (!consultantId) {
              throw new CustomError('Invalid consultant ID', 400);
            }
            await deleteProjectConsultant(req.params.id, consultantId);
          } catch (error) {
            console.error('Error deleting consultant:', error);
            throw error; // Rethrow to be caught by outer catch
          }
        }
      } else if (req.body.removals.media) {
        for (
          let i = 0;
          i < ((req.body.removals.media ?? []) as unknown[]).length;
          i++
        ) {
          try {
            const mediaId = (req.body.removals.media as unknown[])[i] as number;
            console.log('mediaId to be removed', mediaId);
            if (!mediaId) {
              throw new CustomError('Invalid media ID', 400);
            }
            await deleteProjectMedia(mediaId);
          } catch (error) {
            console.error('Error deleting media:', error);
            throw error; // Rethrow to be caught by outer catch
          }
        }
      } else if (req.body.removals.sources) {
        // Handle sourceLinks deletion if needed
      }

      delete req.body.removals; // Remove the removals field from the body before updating
    }
    console.log('Request body after deletions:', req.body);
    const response = await updateProjectWithAudit(req.params.id as number, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

const projectPutWithoutIdParam = async (
  req: Request<{}, {}, Project>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    if (!req.body.id) {
      throw new CustomError('Project ID is required in the request body', 400);
    }
    const response = await updateProjectWithAudit(req.body.id as number, req);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

const projectDelete = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as User;
    if (user.role !== 'admin') {
      throw new CustomError('Unauthorized', 401);
    }
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const success = await deleteProject(req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Project deleted successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

export {
  projectListGet,
  projectFavoritedListGet,
  projectListGetSimple,
  projectGetSimple,
  projectsGetByMetroAreaAndBuildingType,
  projectsGetByCountry,
  searchProjectsBySearchTerm,
  projectGet,
  projectGetCount,
  projectStatusesGet,
  projectsListGetCoordinates,
  projectGetFormatted,
  projectPost,
  projectPut,
  projectPutWithoutIdParam,
  projectDelete,
  projectFavoritePost,
  projectFavoriteDelete
};
