import {LocationInput} from '../types/DBTypes';

interface CatInput {
  cat_name: string;
  weight: number;
  birthdate: Date;
  location: LocationInput;
  filename: string;
}

interface CatModify {
  cat_name: string;
  weight: number;
  birthdate: Date;
  location: LocationInput;
}

export {CatInput, CatModify};
