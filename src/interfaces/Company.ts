import { Architect } from './Architect';
import { Consultant } from './Consultant';
import { Contractor } from './Contractor';
import { Country } from './Country';
import { Developer } from './Developer';

interface Company {
  countrySearched: Country;
  results: {
    developers: Developer[];
    architects: Architect[];
    contractors: Contractor[];
    consultants: Consultant[];
  };
}

export { Company };
