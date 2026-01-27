import { validationResult } from 'express-validator';

import {
  postProject,
  putProject,
  deleteProject,
  getAllProjects,
  getProject,
  checkIfProjectExistsByKey
} from '../models/projectModel';
import { Request, Response, NextFunction } from 'express';
import { PostProject, Project } from '../../interfaces/Project';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import { throwIfValidationErrors, toCamel } from '../../utils/utilities';
import { User } from '../../interfaces/User';
import {
  checkContinentExistsByName,
  postContinent
} from '../models/continentModel';
import { checkCountryExistsByName, postCountry } from '../models/countryModel';
import {
  checkMetroAreaExistsByName,
  postMetroArea
} from '../models/metroAreaModel';
import { MetroArea } from '../../interfaces/MetroArea';
import { Continent } from '../../interfaces/Continent';
import { Country } from '../../interfaces/Country';
import { Address } from '../../interfaces/Address';
import { City } from '../../interfaces/City';
import { checkCityExistsByName, postCity } from '../models/cityModel';
import {
  getAddressByProjectId,
  postAddress,
  putAddress
} from '../models/addressModel';
import {
  checkBuildingTypeExistsByName,
  postBuildingType
} from '../models/buildingTypeModel';
import { BuildingType } from '../../interfaces/BuildingType';
import {
  checkBuildingUseExistsByName,
  postBuildingUse
} from '../models/buildingUseModel';
import { postProjectBuildingUse } from '../models/projectBuildingUse';
import { ProjectBuildingUse } from '../../interfaces/ProjectBuildingUse';

import {
  checkDeveloperExistsByName,
  postDeveloper,
  putDeveloper
} from '../models/developerModel';
import { Developer } from '../../interfaces/Developer';
import { postProjectDeveloper } from '../models/projectDeveloper';
import {
  checkArchitectExistsByName,
  postArchitect,
  putArchitect
} from '../models/architectModel';
import { Architect } from '../../interfaces/Architect';
import { postProjectArchitect } from '../models/projectArchitect';
import { Contractor } from '../../interfaces/Contractor';
import {
  checkContractorExistsByName,
  postContractor,
  putContractor
} from '../models/contractorModel';
import { postProjectContractor } from '../models/projectContractor';
import { ProjectMedia } from '../../interfaces/ProjectMedia';
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

const projectListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await getAllProjects();
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

const projectPost = async (
  req: Request<{}, {}, PostProject>,
  res: Response,
  next: NextFunction
) => {
  try {
    const createdProjectIds: number[] = [];
    const skippedProjects: string[] = [];

    for (const proj of req.body.projects || []) {
      if (!proj.name || !proj.location) {
        throw new CustomError('Project name and location are required', 400);
      }
      const pK = (proj.name.trim().toLowerCase() +
        '|' +
        proj.location.city.trim().toLowerCase() +
        '|' +
        proj.location.country.trim().toLowerCase()) as string;

      const checkProjectKey = await checkIfProjectExistsByKey(pK);
      if (checkProjectKey) {
        skippedProjects.push(pK);
        continue;
      }

      // const user = req.user as User;
      // if (user.role !== 'admin') {
      //   throw new CustomError('Unauthorized', 401);
      // }
      const errors = validationResult(req);
      throwIfValidationErrors(errors);
      if (!proj.location) {
        throw new CustomError('Location is required', 400);
      }
      const continentExists = await checkContinentExistsByName(
        proj.location.continent
      );
      let continentID = continentExists;
      const continent: Continent = {
        name: proj.location.continent as string,
        code: null
      };
      if (continentExists === 0) {
        continentID = await postContinent(continent);
      }
      if (continentID === 0) {
        throw new CustomError('Failed to create continent', 500);
      }

      const countryExists = await checkCountryExistsByName(
        proj.location.country
      );
      let countryID = countryExists;
      const country: Country = {
        name: proj.location.country as string,
        code: null,
        continentId: continentID
      };

      if (countryExists === 0) {
        countryID = await postCountry(country);
      }

      if (countryID === 0) {
        throw new CustomError('Failed to create country', 500);
      }
      const timeNow = new Date(Date.now());
      proj.lastVerifiedDate = timeNow;
      const metroArea: MetroArea = {
        name: proj.location.metroArea,
        countryId: countryID,
        lastSearchedAt: timeNow
      };
      const metroAreaExists = await checkMetroAreaExistsByName(
        proj.location.metroArea
      );
      let metroAreaId = metroAreaExists;
      if (metroAreaExists === 0) {
        metroAreaId = await postMetroArea(metroArea);
      }

      if (metroAreaId === 0) {
        throw new CustomError('Failed to create metro area', 500);
      }

      const cityExists = await checkCityExistsByName(proj.location.city);
      let cityId = cityExists;
      const city: City = {
        name: proj.location.city,
        metroAreaId: metroAreaId
      };
      if (cityExists === 0) {
        cityId = await postCity(city);
      }
      if (cityId === 0) {
        throw new CustomError('Failed to create city', 500);
      }

      const address: Address = {
        address: proj.location.address,
        location: null,
        postcode: proj.location.postcode,
        cityId: cityId
      };

      const addressId = await postAddress(address);
      if (!addressId) {
        throw new CustomError('Failed to create address', 500);
      }

      const buildingTypeExists = await checkBuildingTypeExistsByName(
        proj.buildingType as string
      );
      let buildingTypeId = buildingTypeExists;
      const buildingType: BuildingType = {
        buildingType: proj.buildingType as string
      };
      if (buildingTypeExists === 0) {
        buildingTypeId = await postBuildingType(buildingType);
      }

      const project: Project = {
        name: proj.name,
        expectedDateText: proj.expectedCompletionWindow?.expected || null,
        earliestDateText: proj.expectedCompletionWindow?.earliest || null,
        latestDateText: proj.expectedCompletionWindow?.latest || null,
        addressId: addressId,
        buildingTypeId: buildingTypeId,
        status: proj.status,
        budgetEur: proj.budgetEur,
        glassFacade: proj.glassFacade,
        facadeBasis: proj.facadeBasis,
        lastVerifiedDate: proj.lastVerifiedDate,
        confidenceScore: proj.confidenceScore,
        isActive: proj.isActive,
        projectKey: (proj.name.trim().toLowerCase() +
          '|' +
          proj.location.city.trim().toLowerCase() +
          '|' +
          proj.location.country.trim().toLowerCase()) as string,
        buildingHeightMeters: proj.buildingHeightMeters,
        buildingHeightFloors: proj.buildingHeightFloors
      };
      console.log(project);
      const projectId = await postProject(project);
      for (const url of proj.projectWebsites || []) {
        await postProjectWebsite({ projectId: projectId, url: url });
      }
      for (const media of proj.media || []) {
        await postProjectMedia({
          projectId: projectId,
          url: media.url,
          title: media.title,
          mediaType: media.mediaType
        });
      }
      for (const bu of proj.buildingUse || []) {
        const buildingUseExists = await checkBuildingUseExistsByName(bu);
        let buildingUseId = buildingUseExists;
        if (buildingUseExists === 0) {
          buildingUseId = await postBuildingUse({ buildingUse: bu });
        }
        if (buildingUseId === 0) {
          throw new CustomError('Failed to create building use', 500);
        }
        const projectBuildingUse: ProjectBuildingUse = {
          projectId: projectId,
          buildingUseId: buildingUseId
        };
        await postProjectBuildingUse(projectBuildingUse);
      }
      for (const developer of proj.developers || []) {
        const developerExists = await checkDeveloperExistsByName(
          developer.name
        );
        let developerId = developerExists;
        if (developerExists === 0) {
          const d: Developer = {
            name: developer.name,
            website: developer.website,
            countryId: null,
            email: developer.contact?.email,
            phone: developer.contact?.phone
          };
          developerId = await postDeveloper(d);
        }
        if (developerId === 0) {
          throw new CustomError('Failed to create developer', 500);
        }
        await postProjectDeveloper({
          projectId: projectId,
          developerId: developerId
        });
      }
      for (const architect of proj.architects || []) {
        const architectExists = await checkArchitectExistsByName(
          architect.name
        );
        let architectId = architectExists;
        if (architectExists === 0) {
          const a: Architect = {
            name: architect.name,
            website: architect.website,
            countryId: null,
            email: architect.contact?.email,
            phone: architect.contact?.phone
          };
          architectId = await postArchitect(a);
        }
        if (architectId === 0) {
          throw new CustomError('Failed to create architect', 500);
        }
        await postProjectArchitect({
          projectId: projectId,
          architectId: architectId
        });
      }
      for (const contractor of proj.contractors || []) {
        const contractorExists = await checkContractorExistsByName(
          contractor.name
        );
        let contractorId = contractorExists;
        if (contractorExists === 0) {
          const c: Contractor = {
            name: contractor.name,
            website: contractor.website,
            countryId: null,
            email: contractor.contact?.email,
            phone: contractor.contact?.phone
          };
          contractorId = await postContractor(c);
        }
        if (contractorId === 0) {
          throw new CustomError('Failed to create contractor', 500);
        }
        await postProjectContractor({
          projectId: projectId,
          contractorId: contractorId
        });
      }
      for (const media of proj.media || []) {
        const mediaData: ProjectMedia = {
          url: media.url,
          projectId: projectId,
          title: media.title ?? null,
          mediaType: media.mediaType
        };
        //file uploads not yet implemented
        await postProjectMedia(mediaData);
      }
      for (const source of proj.sources || []) {
        console.log(source);
        await postSourceLink({
          projectId: projectId,
          url: source.url,
          sourceType: source.sourceType,
          publisher: source.publisher,
          accessedAt: source.accessedAt
        });
      }

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
    if (req.body.location) {
      const a: Address = {
        address: req.body.location.address,
        location: null,
        postcode: req.body.location.postcode
      };
      await putAddress(a, address.id as number);
    }
    const project: Project = {
      name: req.body.name,
      expectedDateText: req.body.expectedCompletionWindow?.expected || null,
      earliestDateText: req.body.expectedCompletionWindow?.earliest || null,
      latestDateText: req.body.expectedCompletionWindow?.latest || null,
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
        architectId = await postArchitect({
          name: architect.name,
          website: architect.website,
          countryId: null,
          email: architect.contact?.email,
          phone: architect.contact?.phone
        });
        await postProjectArchitect({
          projectId: req.params.id as number,
          architectId: architectId
        });
      } else {
        await putArchitect(
          {
            name: architect.name,
            website: architect.website,
            // countryId: null,
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
          // countryId: null,
          email: contractor.contact?.email,
          phone: contractor.contact?.phone
        });
        await postProjectContractor({
          projectId: req.params.id as number,
          contractorId: contractorId
        });
      } else {
        await putContractor(
          {
            name: contractor.name,
            website: contractor.website,
            // countryId: null,
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
          countryId: null,
          email: developer.contact?.email,
          phone: developer.contact?.phone
        });
        await postProjectDeveloper({
          projectId: req.params.id as number,
          developerId: developerId
        });
      } else {
        await putDeveloper(
          {
            name: developer.name,
            website: developer.website,
            countryId: null,
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
      const buildingUseExists = await checkBuildingUseExistsByName(bu);
      let buildingUseId = buildingUseExists;
      if (buildingUseExists === 0) {
        buildingUseId = await postBuildingUse({ buildingUse: bu });
      }
      if (buildingUseId === 0) {
        throw new CustomError('Failed to create building use', 500);
      }

      if (buildingUseExists === 0) {
        const projectBuildingUse: ProjectBuildingUse = {
          projectId: req.params.id as number,
          buildingUseId: buildingUseId
        };
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

export { projectListGet, projectGet, projectPost, projectPut, projectDelete };
