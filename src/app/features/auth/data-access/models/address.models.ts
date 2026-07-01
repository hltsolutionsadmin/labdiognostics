export type AddressType = 'Home' | 'Work' | 'Other';

export type Address = {
  id: string;
  fullName: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType: AddressType;
  isDefault: boolean;
};

export type CreateAddressRequest = Omit<Address, 'id'> & {
  countryId: string;
  stateId: string;
  cityId: string;
};

export type UpdateAddressRequest = Partial<CreateAddressRequest>;

export type Country = {
  id: string;
  name: string;
  countryCode: string;
};

export type State = {
  id: string;
  name: string;
  countryId?: string;
  countryCode: string;
  stateCode: string;
};

export type City = {
  id: string;
  name: string;
  stateId?: string;
  countryId?: string;
  stateCode: string;
  countryCode?: string;
};
