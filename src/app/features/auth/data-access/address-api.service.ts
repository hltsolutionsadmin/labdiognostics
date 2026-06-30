import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Address, AddressType, City, Country, CreateAddressRequest, State, UpdateAddressRequest } from './models/address.models';

type RawAddress = Record<string, unknown>;

function text(raw: RawAddress, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
  }
  return fallback;
}

function nestedText(raw: RawAddress, objectKey: string, keys: string[]): string {
  const value = raw[objectKey];
  if (!value || typeof value !== 'object') return '';
  return text(value as RawAddress, keys);
}

function bool(raw: RawAddress, keys: string[]): boolean {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'boolean') return value;
  }
  return false;
}

function type(raw: RawAddress): AddressType {
  const value = text(raw, ['addressType', 'type'], 'Home').toLowerCase();
  if (value === 'work' || value === 'office') return 'Work';
  if (value === 'other') return 'Other';
  return 'Home';
}

function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];

  const o = raw as Record<string, unknown>;
  for (const key of ['addresses', 'items', 'data', 'content']) {
    const value = o[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function toAddress(raw: unknown): Address {
  const o = (raw && typeof raw === 'object' ? raw : {}) as RawAddress;
  return {
    id: text(o, ['id', 'addressId', '_id']),
    fullName: text(o, ['fullName', 'name', 'recipientName']),
    mobileNumber: text(o, ['mobileNumber', 'mobile', 'phoneNumber', 'phone']),
    addressLine1: text(o, ['addressLine1', 'line1', 'streetAddress']),
    addressLine2: text(o, ['addressLine2', 'line2']),
    landmark: text(o, ['landmark']),
    countryId: text(o, ['countryId']) || nestedText(o, 'country', ['id', 'countryId']),
    stateId: text(o, ['stateId']) || nestedText(o, 'state', ['id', 'stateId']),
    cityId: text(o, ['cityId']) || nestedText(o, 'city', ['id', 'cityId']),
    city: text(o, ['city', 'cityName']) || nestedText(o, 'city', ['name', 'cityName']),
    state: text(o, ['state', 'stateName', 'province']) || nestedText(o, 'state', ['name', 'stateName']),
    country: text(o, ['country', 'countryName']) || nestedText(o, 'country', ['name', 'countryName']) || 'India',
    postalCode: text(o, ['postalCode', 'pincode', 'zipCode', 'zip']),
    addressType: type(o),
    isDefault: bool(o, ['isDefault', 'defaultAddress', 'default'])
  };
}

function toCountry(raw: unknown): Country {
  const o = (raw && typeof raw === 'object' ? raw : {}) as RawAddress;
  return {
    id: text(o, ['id', 'countryId']),
    name: text(o, ['name', 'countryName']),
    countryCode: text(o, ['countryCode', 'country_code', 'code', 'isoCode', 'iso_code'])
  };
}

function toState(raw: unknown): State {
  const o = (raw && typeof raw === 'object' ? raw : {}) as RawAddress;
  return {
    id: text(o, ['id', 'stateId']),
    name: text(o, ['name', 'stateName']),
    countryId: text(o, ['countryId']) || nestedText(o, 'country', ['id', 'countryId']),
    countryCode: text(o, ['countryCode', 'country_code']) || nestedText(o, 'country', ['countryCode', 'country_code', 'code', 'isoCode', 'iso_code']),
    stateCode: text(o, ['stateCode', 'state_code', 'code'])
  };
}

function toCity(raw: unknown): City {
  const o = (raw && typeof raw === 'object' ? raw : {}) as RawAddress;
  return {
    id: text(o, ['id', 'cityId']),
    name: text(o, ['name', 'cityName']),
    stateId: text(o, ['stateId']) || nestedText(o, 'state', ['id', 'stateId']),
    countryId: text(o, ['countryId']) || nestedText(o, 'country', ['id', 'countryId']),
    stateCode: text(o, ['stateCode', 'state_code']) || nestedText(o, 'state', ['stateCode', 'state_code', 'code']),
    countryCode: text(o, ['countryCode', 'country_code']) || nestedText(o, 'country', ['countryCode', 'country_code', 'code', 'isoCode', 'iso_code'])
  };
}

function sameCode(a: string | undefined, b: string | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

@Injectable({ providedIn: 'root' })
export class AddressApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly userAddressesUrl = `${this.baseUrl}/api/users/me/addresses`;

  getAddresses(): Observable<Address[]> {
    return this.http.get<unknown>(this.userAddressesUrl).pipe(map((raw) => extractList(raw).map(toAddress)));
  }

  getCountries(): Observable<Country[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/api/countries`)
      .pipe(map((raw) => extractList(raw).map(toCountry).filter((country) => country.id && country.name && country.countryCode)));
  }

  getStates(): Observable<State[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/api/states`)
      .pipe(map((raw) => extractList(raw).map(toState).filter((state) => state.id && state.name && state.countryCode && state.stateCode)));
  }

  getCities(): Observable<City[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/api/cities?page=0&size=1000`)
      .pipe(map((raw) => extractList(raw).map(toCity).filter((city) => city.id && city.name && city.stateCode)));
  }

  filterStatesByCountryCode(states: State[], countryCode: string): State[] {
    return states.filter((state) => sameCode(state.countryCode, countryCode));
  }

  filterCitiesByStateCode(cities: City[], stateCode: string): City[] {
    return cities.filter((city) => sameCode(city.stateCode, stateCode));
  }

  createAddress(payload: CreateAddressRequest): Observable<Address> {
    return this.http.post<unknown>(this.userAddressesUrl, payload).pipe(map(toAddress));
  }

  updateAddress(addressId: string, payload: UpdateAddressRequest): Observable<Address> {
    return this.http.patch<unknown>(`${this.userAddressesUrl}/${addressId}`, payload).pipe(map(toAddress));
  }

  deleteAddress(addressId: string): Observable<void> {
    return this.http.delete<void>(`${this.userAddressesUrl}/${addressId}`);
  }
}
