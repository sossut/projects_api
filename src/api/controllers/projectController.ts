import { validationResult } from 'express-validator';

import {
  postProject,
  putProject,
  deleteProject,
  getAllProjects,
  getProject
} from '../models/projectModel';
import { Request, Response, NextFunction } from 'express';
import { PostProject } from '../../interfaces/Project';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import { throwIfValidationErrors, toCamel } from '../../utils/utilities';
import { User } from '../../interfaces/User';
import {
  checkContinentExistsByName,
  postContinent
} from '../models/continentModel';
import { checkCountryExistsByName, postCountry } from '../models/countryModel';
import { postSearchArea } from '../models/searchAreaModel';
import { SearchArea } from '../../interfaces/SearchArea';
import { Continent } from '../../interfaces/Continent';
import { Country } from '../../interfaces/Country';
import { Address } from '../../interfaces/Address';
import { City } from '../../interfaces/City';
import { checkCityExistsByName, postCity } from '../models/cityModel';

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
    //FIRST CHECK IF PROJECT EXIST WITH PROJECT KEY!!!!!!!!
    //!!!!!!!!!!!!
    //!!!!!!!!!!

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
    if (!continentID) {
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

    if (!countryID) {
      throw new CustomError('Failed to create country', 500);
    }
    const timeNow = new Date(Date.now());
    req.body.lastVerifiedDate = timeNow;
    const searchArea: SearchArea = {
      name: req.body.location.metroArea,
      countryId: countryID,
      lastSearchedAt: timeNow
    };
    const searchAreaId = await postSearchArea(searchArea);
    if (!searchAreaId) {
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
    if (!cityId) {
      throw new CustomError('Failed to create city', 500);
    }

    const address: Address = {
      address: req.body.location.address,
      location: null,
      postcode: req.body.location.postcode,
      cityId: cityId
    };
    console.log(address);
    const projectId = await postProject(req.body);
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
