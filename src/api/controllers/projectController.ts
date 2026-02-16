import { validationResult } from 'express-validator';

import {
  deleteProject,
  getAllProjects,
  getAllProjectsSimple,
  getProject
} from '../models/projectModel';

import { Request, Response, NextFunction } from 'express';
import { PostProject, Project } from '../../interfaces/Project';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import {
  findProjectIdByKey,
  throwIfValidationErrors,
  toCamel
} from '../../utils/utilities';
import { User } from '../../interfaces/User';
import {} from '../models/continentModel';

import { addNewProjectToDB } from '../../utils/applyEnrichedDataToProject';
import updateProjectWithAudit from '../../utils/updateProjectWithAudit';

const projectListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sortBy = req.query.sortBy as string | undefined;
    const order =
      (req.query.order as 'asc' | 'desc' | undefined)?.toLowerCase() || 'asc';

    // Build filters object from query params
    const filters: { [key: string]: string | number } = {};
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.city) filters.city = req.query.city as string;
    if (req.query.metroArea) filters.metroArea = req.query.metroArea as string;
    if (req.query.country) filters.country = req.query.country as string;
    if (req.query.continent) filters.continent = req.query.continent as string;
    if (req.query.buildingType)
      filters.buildingType = req.query.buildingType as string;
    if (req.query.minBudget)
      filters.minBudget = parseFloat(req.query.minBudget as string);
    if (req.query.maxBudget)
      filters.maxBudget = parseFloat(req.query.maxBudget as string);

    // Validate limit and page query parameters
    const MAX_LIMIT = 100;
    let limit = Number(req.query.limit) || 50;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * (limit ?? 50);

    const rows = await getAllProjects(
      sortBy,
      order === 'desc' ? 'DESC' : 'ASC',
      Object.keys(filters).length > 0 ? filters : undefined,
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
    const sortBy = req.query.sortBy as string | undefined;
    const order =
      (req.query.order as 'asc' | 'desc' | undefined)?.toLowerCase() || 'asc';

    // Build filters object from query params
    const filters: { [key: string]: string | number } = {};
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.city) filters.city = req.query.city as string;
    if (req.query.metroArea) filters.metroArea = req.query.metroArea as string;
    if (req.query.country) filters.country = req.query.country as string;
    if (req.query.continent) filters.continent = req.query.continent as string;
    if (req.query.buildingType)
      filters.buildingType = req.query.buildingType as string;
    if (req.query.minBudget)
      filters.minBudget = parseFloat(req.query.minBudget as string);
    if (req.query.maxBudget)
      filters.maxBudget = parseFloat(req.query.maxBudget as string);

    // Validate limit and page query parameters
    const MAX_LIMIT = 100;
    let limit = Number(req.query.limit) || 50;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * (limit ?? 50);

    const rows = await getAllProjectsSimple(
      sortBy,
      order === 'desc' ? 'DESC' : 'ASC',
      Object.keys(filters).length > 0 ? filters : undefined,
      limit,
      offset
    );
    const projects = rows.map((row) => toCamel(row));
    res.json(projects);
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
    console.log(project);
    const formattedProject = {
      id: project.id,
      name: project.name,
      buildingHeightMeters: project.buildingHeightMeters,
      buildingHeightFloors: project.buildingHeightFloors,
      location: {
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
      buildingUse: project.buildingUses?.map((bu: any) => ({
        buildingUse: bu.buildingUse
      })),
      budgetEur: project.budgetEur,
      glassFacade: project.glassFacade,
      facadeBasis: project.facadeBasis,
      status: project.status,
      lastVerifiedDate: project.lastVerifiedDate,
      confidenceScore: project.confidenceScore,
      isActive: project.isActive,
      projectWebsites: project.projectWebsites,
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
          name: cons.name,
          source: cons.source,
          website: cons.contact?.website ?? cons.website,
          contact: {
            phone: cons.contact?.phone ?? cons.phone,
            email: cons.contact?.email ?? cons.email
          }
        })) || [],
      media: project.projectMedias,
      sources: project.sourceLinks
    };
    console.log(formattedProject.architects);
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
      if (existingProjectId) {
        skippedProjects.push(projectKey);
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
  projectListGetSimple,
  projectGet,
  projectGetFormatted,
  projectPost,
  projectPut,
  projectPutWithoutIdParam,
  projectDelete
};
