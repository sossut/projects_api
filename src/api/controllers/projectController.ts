import { validationResult } from 'express-validator';

import {
  putProject,
  deleteProject,
  getAllProjects,
  getProject
} from '../models/projectModel';
import { Request, Response, NextFunction } from 'express';
import { PostProject, Project } from '../../interfaces/Project';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import {
  throwIfValidationErrors,
  toCamel,
  parseToStandardDate
} from '../../utils/utilities';
import { User } from '../../interfaces/User';
import {} from '../models/continentModel';
import { checkCountryExistsByName } from '../models/countryModel';

import { Address } from '../../interfaces/Address';

import { getAddressByProjectId, putAddress } from '../models/addressModel';

import {
  checkBuildingUseExistsByName,
  postBuildingUse
} from '../models/buildingUseModel';
import {
  checkProjectBuildingUseExists,
  postProjectBuildingUse
} from '../models/projectBuildingUseModel';
import { ProjectBuildingUse } from '../../interfaces/ProjectBuildingUse';

import {
  checkDeveloperExistsByName,
  postDeveloper,
  putDeveloper
} from '../models/developerModel';

import { postProjectDeveloper } from '../models/projectDeveloperModel';
import {
  checkArchitectExistsByName,
  postArchitect,
  putArchitect
} from '../models/architectModel';

import { postProjectArchitect } from '../models/projectArchitectModel';

import {
  checkContractorExistsByName,
  postContractor,
  putContractor
} from '../models/contractorModel';
import { postProjectContractor } from '../models/projectContractorModel';

import {
  checkProjectMediaExistsByUrl,
  postProjectMedia
} from '../models/projectMediaModel';
import {
  checkSourceLinkExistsByUrl,
  postSourceLink
} from '../models/sourceLinkModel';
import {
  checkProjectWebsiteExistsByUrl,
  postProjectWebsite
} from '../models/projectWebsiteModel';
import {
  postDevelopersPresence,
  checkDeveloperPresenceInCountry
} from '../models/developersPresenceModel';
import {
  postArchitectsPresence,
  checkArchitectPresenceInCountry
} from '../models/architectsPresenceModel';
import {
  postContractorsPresence,
  checkContractorPresenceInCountry
} from '../models/contractorsPresenceModel';
import { addNewProjectToDB } from '../../utils/applyEnrichedDataToProject';

const projectListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sortBy = req.query.sortBy as string | undefined;
    const order = req.query.order as 'asc' | 'desc' | undefined;

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

    const rows = await getAllProjects(
      sortBy,
      order === 'desc' ? 'DESC' : 'ASC',
      Object.keys(filters).length > 0 ? filters : undefined
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
      const projectId = await addNewProjectToDB(proj);

      if (projectId) {
        createdProjectIds.push(projectId);
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
    const timeNow = new Date(Date.now());
    req.body.lastVerifiedDate = timeNow;
    const address = await getAddressByProjectId(req.params.id as number);
    if (!address) {
      throw new CustomError('Address not found for project', 500);
    }
    const countryId = await checkCountryExistsByName(
      req.body.location?.country as string
    );

    if (req.body.location) {
      const a: Address = {
        address: req.body.location.address,
        location: {
          type: 'Point',
          coordinates: [
            (req.body.location.coordinates?.longitude as number) || 0,
            (req.body.location.coordinates?.latitude as number) || 0
          ]
        },
        postcode: req.body.location.postcode
      };
      await putAddress(a, address.id as number);
    }
    const expectedDate = parseToStandardDate(
      req.body.expectedCompletionWindow?.expected || ''
    );
    const project: Project = {
      name: req.body.name,
      expectedDateText:
        (req.body.expectedCompletionWindow?.expected as string)?.slice(
          0,
          100
        ) || null,
      earliestDateText:
        (req.body.expectedCompletionWindow?.earliest as string)?.slice(
          0,
          100
        ) || null,
      latestDateText:
        (req.body.expectedCompletionWindow?.latest as string)?.slice(0, 100) ||
        null,
      expectedDate: new Date(expectedDate || ''),
      addressId: address.id as number,
      buildingTypeId: req.body.buildingTypeId,
      status: req.body.status,
      budgetEur: req.body.budgetEur,
      glassFacade: req.body.glassFacade,
      facadeBasis: req.body.facadeBasis,
      lastVerifiedDate: req.body.lastVerifiedDate,
      confidenceScore: req.body.confidenceScore,
      isActive: req.body.isActive,
      buildingHeightMeters: req.body.buildingHeightMeters,
      buildingHeightFloors: req.body.buildingHeightFloors
    };
    for (const architect of req.body.architects || []) {
      const checkedArchitect = await checkArchitectExistsByName(architect.name);
      let architectId = checkedArchitect;
      if (checkedArchitect === 0) {
        console.log(architect);
        architectId = await postArchitect({
          name: architect.name,
          website: architect.website,
          hqCountryId: null,
          email: architect.contact?.email,
          phone: architect.contact?.phone
        });
        await postProjectArchitect({
          projectId: req.params.id as number,
          architectId: architectId,
          source: architect.source as string
        });
        if (countryId !== 0) {
          const architectPresenceExists = await checkArchitectPresenceInCountry(
            architectId,
            countryId
          );
          if (!architectPresenceExists) {
            await postArchitectsPresence({
              architectId: architectId,
              countryId: countryId
            });
          }
        }
      } else {
        await putArchitect(
          {
            name: architect.name,
            website: architect.website,
            // hqCountryId: null,
            email: architect.contact?.email,
            phone: architect.contact?.phone
          },
          architectId
        );
      }
    }
    for (const contractor of req.body.contractors || []) {
      const checkedContractor = await checkContractorExistsByName(
        contractor.name
      );
      let contractorId = checkedContractor;
      if (checkedContractor === 0) {
        contractorId = await postContractor({
          name: contractor.name,
          website: contractor.website,
          hqCountryId: null,
          email: contractor.contact?.email,
          phone: contractor.contact?.phone
        });
        await postProjectContractor({
          projectId: req.params.id as number,
          contractorId: contractorId,
          source: contractor.source as string
        });
        if (countryId !== 0) {
          const contractorPresenceExists =
            await checkContractorPresenceInCountry(contractorId, countryId);
          if (!contractorPresenceExists) {
            await postContractorsPresence({
              contractorId: contractorId,
              countryId: countryId
            });
          }
        }
      } else {
        await putContractor(
          {
            name: contractor.name,
            website: contractor.website,
            // hqCountryId: null,
            email: contractor.contact?.email,
            phone: contractor.contact?.phone
          },
          contractorId
        );
      }
    }
    for (const developer of req.body.developers || []) {
      const checkedDeveloper = await checkDeveloperExistsByName(developer.name);
      let developerId = checkedDeveloper;
      if (checkedDeveloper === 0) {
        developerId = await postDeveloper({
          name: developer.name,
          website: developer.website,
          hqCountryId: null,
          email: developer.contact?.email,
          phone: developer.contact?.phone
        });
        await postProjectDeveloper({
          projectId: req.params.id as number,
          developerId: developerId,
          source: developer.source as string
        });
        if (countryId !== 0) {
          const developerPresenceExists = await checkDeveloperPresenceInCountry(
            developerId,
            countryId
          );
          if (!developerPresenceExists) {
            await postDevelopersPresence({
              developerId: developerId,
              countryId: countryId
            });
          }
        }
      } else {
        await putDeveloper(
          {
            name: developer.name,
            website: developer.website,
            // hqCountryId: null,
            email: developer.contact?.email,
            phone: developer.contact?.phone
          },
          developerId
        );
      }
    }
    for (const media of req.body.media || []) {
      console.log(media.title);
      const checkMedia = await checkProjectMediaExistsByUrl(media.url);
      if (!checkMedia) {
        await postProjectMedia({
          projectId: req.params.id as number,
          url: media.url,
          title: media.title,
          mediaType: media.mediaType
        });
      }
    }
    for (const bu of req.body.buildingUse || []) {
      console.log({ bu });
      const buildingUseExists = await checkBuildingUseExistsByName(bu);
      let buildingUseId = buildingUseExists;
      if (buildingUseExists === 0) {
        buildingUseId = await postBuildingUse({ buildingUse: bu });
      }
      if (buildingUseId === 0) {
        throw new CustomError('Failed to create building use', 500);
      }
      console.log('test2');
      const checkProjectBuildingUse = await checkProjectBuildingUseExists(
        req.params.id as number,
        buildingUseId
      );
      if (!checkProjectBuildingUse) {
        const projectBuildingUse: ProjectBuildingUse = {
          projectId: req.params.id as number,
          buildingUseId: buildingUseId
        };
        console.log('test');
        await postProjectBuildingUse(projectBuildingUse);
      }
    }
    for (const url of req.body.projectWebsites || []) {
      const checkWebsite = await checkProjectWebsiteExistsByUrl(url);
      if (!checkWebsite) {
        await postProjectWebsite({
          projectId: req.params.id as number,
          url: url
        });
      }
    }
    for (const source of req.body.sources || []) {
      const checkSource = await checkSourceLinkExistsByUrl(source.url);
      if (!checkSource) {
        await postSourceLink({
          projectId: req.params.id as number,
          url: source.url,
          sourceType: source.sourceType,
          publisher: source.publisher,
          accessedAt: source.accessedAt
        });
      }
    }

    const success = await putProject(project, req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Project updated successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
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
  projectGet,
  projectGetFormatted,
  projectPost,
  projectPut,
  projectDelete
};
