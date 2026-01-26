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
  checkSearchAreaExistsByName,
  postSearchArea
} from '../models/searchAreaModel';
import { SearchArea } from '../../interfaces/SearchArea';
import { Continent } from '../../interfaces/Continent';
import { Country } from '../../interfaces/Country';
import { Address } from '../../interfaces/Address';
import { City } from '../../interfaces/City';
import { checkCityExistsByName, postCity } from '../models/cityModel';
import { postAddress } from '../models/addressModel';
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
import { postProjectWebsite } from '../models/projectWebsite';
import {
  checkDeveloperExistsByName,
  postDeveloper
} from '../models/developerModel';
import { Developer } from '../../interfaces/Developer';
import { postProjectDeveloper } from '../models/projectDeveloper';
import {
  checkArchitectExistsByName,
  postArchitect
} from '../models/architectModel';
import { Architect } from '../../interfaces/Architect';
import { postProjectArchitect } from '../models/projectArchitect';
import { Contractor } from '../../interfaces/Contractor';
import {
  checkContractorExistsByName,
  postContractor
} from '../models/contractorModel';
import { postProjectContractor } from '../models/projectContractor';
import { ProjectMedia } from '../../interfaces/ProjectMedia';
import { postProjectMedia } from '../models/projectMediaModel';
import { postSourceLink } from '../models/sourceLinkModel';

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
    const checkProjectKey = await checkIfProjectExistsByKey(
      req.body.projectKey as string
    );
    if (checkProjectKey) {
      throw new CustomError(
        'Project with the same project key already exists',
        400
      );
    }

    const user = req.user as User;
    if (user.role !== 'admin') {
      throw new CustomError('Unauthorized', 401);
    }
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    if (!req.body.location) {
      throw new CustomError('Location is required', 400);
    }
    const continentExists = await checkContinentExistsByName(
      req.body.location.continent
    );
    let continentID = continentExists;
    const continent: Continent = {
      name: req.body.location.continent as string,
      code: null
    };
    if (continentExists === 0) {
      continentID = await postContinent(continent);
    }
    if (continentID === 0) {
      throw new CustomError('Failed to create continent', 500);
    }

    const countryExists = await checkCountryExistsByName(
      req.body.location.country
    );
    let countryID = countryExists;
    const country: Country = {
      name: req.body.location.country as string,
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
    req.body.lastVerifiedDate = timeNow;
    const searchArea: SearchArea = {
      name: req.body.location.metroArea,
      countryId: countryID,
      lastSearchedAt: timeNow
    };
    const searchAreaExists = await checkSearchAreaExistsByName(
      req.body.location.metroArea
    );
    let searchAreaId = searchAreaExists;
    if (searchAreaExists === 0) {
      searchAreaId = await postSearchArea(searchArea);
    }

    if (searchAreaId === 0) {
      throw new CustomError('Failed to create search area', 500);
    }

    const cityExists = await checkCityExistsByName(req.body.location.city);
    let cityId = cityExists;
    const city: City = {
      name: req.body.location.city,
      searchAreaId: searchAreaId
    };
    if (cityExists === 0) {
      cityId = await postCity(city);
    }
    if (cityId === 0) {
      throw new CustomError('Failed to create city', 500);
    }

    const address: Address = {
      address: req.body.location.address,
      location: null,
      postcode: req.body.location.postcode,
      cityId: cityId
    };

    const addressId = await postAddress(address);
    if (!addressId) {
      throw new CustomError('Failed to create address', 500);
    }

    const buildingTypeExists = await checkBuildingTypeExistsByName(
      req.body.buildingType as string
    );
    let buildingTypeId = buildingTypeExists;
    const buildingType: BuildingType = {
      buildingType: req.body.buildingType as string
    };
    if (buildingTypeExists === 0) {
      buildingTypeId = await postBuildingType(buildingType);
    }

    const project: Project = {
      name: req.body.name,
      expectedDateText: req.body.expectedCompletionWindow?.expected,
      earliestDate: req.body.expectedCompletionWindow?.earliest
        ? new Date(req.body.expectedCompletionWindow.earliest)
        : undefined,
      latestDate: req.body.expectedCompletionWindow?.latest
        ? new Date(req.body.expectedCompletionWindow.latest)
        : undefined,
      addressId: addressId,
      buildingTypeId: buildingTypeId,
      status: req.body.status,
      budgetEur: req.body.budgetEur,
      glassFacade: req.body.glassFacade,
      facadeBasis: req.body.facadeBasis,
      lastVerifiedDate: req.body.lastVerifiedDate,
      confidenceScore: req.body.confidenceScore,
      isActive: req.body.isActive,
      projectKey: req.body.projectKey,
      buildingHeightMeters: req.body.buildingHeightMeters,
      buildingHeightFloors: req.body.buildingHeightFloors
    };
    const projectId = await postProject(project);
    for (const url of req.body.projectWebsites || []) {
      await postProjectWebsite({ projectId: projectId, url: url });
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
      const projectBuildingUse: ProjectBuildingUse = {
        projectId: projectId,
        buildingUseId: buildingUseId
      };
      await postProjectBuildingUse(projectBuildingUse);
    }
    for (const developer of req.body.developers || []) {
      const developerExists = await checkDeveloperExistsByName(developer.name);
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
    for (const architect of req.body.architects || []) {
      const architectExists = await checkArchitectExistsByName(architect.name);
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
    for (const contractor of req.body.contractors || []) {
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
    for (const media of req.body.media || []) {
      const mediaData: ProjectMedia = {
        url: media.url,
        projectId: projectId,
        title: media.title,
        mediaType: media.mediaType
      };
      // filename will be generated automatically when downloading the media
      await postProjectMedia(mediaData);
    }
    for (const source of req.body.sources || []) {
      await postSourceLink({
        projectId: projectId,
        url: source.url,
        sourceType: source.sourceType,
        publisher: source.publisher,
        accessedAt: source.accessedAt
      });
    }

    if (projectId) {
      const response: MessageResponse = {
        message: 'Project created successfully',
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
    const user = req.user as User;
    if (user.role !== 'admin') {
      throw new CustomError('Unauthorized', 401);
    }
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const success = await putProject(req.body, req.params.id as number);
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
