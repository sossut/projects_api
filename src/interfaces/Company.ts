import { Architect } from './Architect';
import { Contractor } from './Contractor';
import { Country } from './Country';
import { Developer } from './Developer';

interface Company {
  countrySearched: Country;
  results: {
    developers: Developer[];
    architects: Architect[];
    contractors: Contractor[];
  };
}

export { Company };
