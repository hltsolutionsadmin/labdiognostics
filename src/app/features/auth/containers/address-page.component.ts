import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { Address, AddressType, City, Country, CreateAddressRequest, State } from '../data-access/models/address.models';
import { AddressApiService } from '../data-access/address-api.service';
import { AddressSignalService } from '../data-access/address-signal.service';

@Component({
  selector: 'app-address-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './address-page.component.html',
  styleUrl: './address-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressPageComponent implements OnInit {
  readonly addressStore = inject(AddressSignalService);
  private readonly addressApi = inject(AddressApiService);

  readonly addresses = this.addressStore.addresses;
  readonly isLoading = this.addressStore.isLoading;
  readonly isSaving = this.addressStore.isSaving;
  readonly isDeleting = this.addressStore.isDeleting;
  readonly error = this.addressStore.error;
  readonly success = this.addressStore.success;
  readonly hasAddresses = this.addressStore.hasAddresses;
  readonly isFormOpen = signal(false);
  readonly editingAddress = signal<Address | null>(null);
  readonly title = computed(() => (this.editingAddress() ? 'Edit Address' : 'Create Address'));
  readonly countries = signal<Country[]>([]);
  readonly states = signal<State[]>([]);
  readonly cities = signal<City[]>([]);
  readonly isLoadingLocations = signal(false);
  readonly locationError = signal<string | null>(null);
  readonly selectedCountryId = signal('');
  readonly selectedStateId = signal('');
  readonly selectedCountryCode = computed(() => {
    const countryId = this.selectedCountryId();
    return this.countries().find((country) => country.id === countryId)?.countryCode ?? '';
  });
  readonly selectedStateCode = computed(() => {
    const stateId = this.selectedStateId();
    return this.states().find((state) => state.id === stateId)?.stateCode ?? '';
  });
  readonly filteredStates = computed(() => {
    const countryCode = this.selectedCountryCode();
    if (!countryCode) return [];
    return this.addressApi.filterStatesByCountryCode(this.states(), countryCode);
  });
  readonly filteredCities = computed(() => {
    const stateCode = this.selectedStateCode();
    if (!stateCode) return [];
    return this.addressApi.filterCitiesByStateCode(this.cities(), stateCode);
  });

  readonly form = new FormGroup({
    fullName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    mobileNumber: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9+\-\s()]{8,16}$/)]
    }),
    addressLine1: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    addressLine2: new FormControl<string>('', { nonNullable: true }),
    landmark: new FormControl<string>('', { nonNullable: true }),
    countryId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    stateId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    cityId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    postalCode: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    addressType: new FormControl<AddressType>('Home', { nonNullable: true, validators: [Validators.required] }),
    isDefault: new FormControl<boolean>(false, { nonNullable: true })
  });

  ngOnInit(): void {
    this.addressStore.loadAddresses();
  }

  openCreate(): void {
    this.addressStore.clearMessages();
    this.editingAddress.set(null);
    this.form.reset({
      fullName: '',
      mobileNumber: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      countryId: '',
      stateId: '',
      cityId: '',
      postalCode: '',
      addressType: 'Home',
      isDefault: false
    });
    this.isFormOpen.set(true);
    this.selectedCountryId.set('');
    this.selectedStateId.set('');
    this.loadLocations();
  }

  openEdit(address: Address): void {
    this.addressStore.clearMessages();
    this.editingAddress.set(address);
    this.form.setValue({
      fullName: address.fullName,
      mobileNumber: address.mobileNumber,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? '',
      landmark: address.landmark ?? '',
      countryId: address.countryId ?? '',
      stateId: address.stateId ?? '',
      cityId: address.cityId ?? '',
      postalCode: address.postalCode,
      addressType: address.addressType,
      isDefault: address.isDefault
    });
    this.isFormOpen.set(true);
    this.selectedCountryId.set(address.countryId ?? '');
    this.selectedStateId.set(address.stateId ?? '');
    this.loadLocations();
  }

  closeForm(): void {
    if (this.isSaving()) return;
    this.isFormOpen.set(false);
    this.editingAddress.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const country = this.countries().find((item) => item.id === value.countryId);
    const state = this.states().find((item) => item.id === value.stateId);
    const city = this.cities().find((item) => item.id === value.cityId);
    const payload: CreateAddressRequest = {
      ...value,
      country: country?.name ?? '',
      state: state?.name ?? '',
      city: city?.name ?? ''
    };
    const editing = this.editingAddress();
    const request$ = editing
      ? this.addressStore.updateAddress(editing.id, payload)
      : this.addressStore.createAddress(payload);

    request$.subscribe({
      next: () => this.closeAfterSave(),
      error: (err: unknown) => this.addressStore.showError(err, 'We could not save this address. Please check the details and try again.')
    });
  }

  deleteAddress(address: Address): void {
    if (this.isDeleting()) return;
    const confirmed = confirm(`Delete ${address.addressType} address for ${address.fullName}?`);
    if (!confirmed) return;
    this.addressStore.deleteAddress(address.id);
  }

  fieldInvalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  onCountryChange(): void {
    const countryId = this.form.controls.countryId.value;
    this.selectedCountryId.set(countryId);
    this.selectedStateId.set('');
    this.form.controls.stateId.setValue('');
    this.form.controls.cityId.setValue('');
  }

  onStateChange(): void {
    const stateId = this.form.controls.stateId.value;
    this.selectedStateId.set(stateId);
    this.form.controls.cityId.setValue('');
  }

  loadLocations(): void {
    this.isLoadingLocations.set(true);
    this.locationError.set(null);

    forkJoin({
      countries: this.addressApi.getCountries(),
      states: this.addressApi.getStates(),
      cities: this.addressApi.getCities()
    })
      .pipe(finalize(() => this.isLoadingLocations.set(false)))
      .subscribe({
        next: ({ countries, states, cities }) => {
          this.countries.set(countries);
          this.states.set(states);
          this.cities.set(cities);
          this.syncEditingLocationIds();
        },
        error: () => this.locationError.set('We could not load countries, states, and cities. Please try again.')
      });
  }

  private closeAfterSave(): void {
    this.isFormOpen.set(false);
    this.editingAddress.set(null);
  }

  private syncEditingLocationIds(): void {
    const address = this.editingAddress();
    if (!address) return;

    const countryId =
      this.form.controls.countryId.value ||
      this.countries().find((country) => country.name.toLowerCase() === address.country.toLowerCase())?.id ||
      '';
    const stateId =
      this.form.controls.stateId.value ||
      this.states().find((state) => state.name.toLowerCase() === address.state.toLowerCase())?.id ||
      '';
    const cityId =
      this.form.controls.cityId.value ||
      this.cities().find((city) => city.name.toLowerCase() === address.city.toLowerCase())?.id ||
      '';

    this.form.patchValue({ countryId, stateId, cityId });
    this.selectedCountryId.set(countryId);
    this.selectedStateId.set(stateId);
  }
}
