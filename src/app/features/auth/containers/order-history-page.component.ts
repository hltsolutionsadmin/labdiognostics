import { ChangeDetectionStrategy, Component, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthSignalService } from '../data-access/auth-signal.service';
import { OrdersApiService, OrderItem } from '../../checkout/data-access/orders-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type OrderStatus = 'Completed' | 'Cancelled' | 'Processing' | 'Sample Collected' | 'Pending' | 'Confirmed';

type OrderRow = {
  id: string;
  title: string;
  subtitle: string;
  dateText: string;
  timeText: string;
  amount: number;
  mrp?: number;
  status: OrderStatus;
};

@Component({
  selector: 'app-order-history-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CurrencyPipe],
  templateUrl: './order-history-page.component.html',
  styleUrl: './order-history-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderHistoryPageComponent implements OnInit {
  private readonly auth = inject(AuthSignalService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly user = this.auth.user;

  // State signals
  private readonly loading = signal<boolean>(true);
  private readonly error = signal<string | null>(null);
  private readonly allOrders = signal<ReadonlyArray<OrderItem>>([]);
  private readonly _currentPage = signal<number>(0);
  private readonly _pageSize = signal<number>(10);
  private readonly totalCount = signal<number>(0);
  private readonly _totalPages = signal<number>(0);
  private readonly isFiltering = signal<boolean>(false);

  // Filter signals
  private readonly searchQuery = signal<string>('');
  private readonly statusFilter = signal<string>('All');
  private readonly startDate = signal<Date | null>(null);
  private readonly endDate = signal<Date | null>(null);

  readonly isLoading = this.loading.asReadonly();
  readonly errorMessage = this.error.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  
  // Computed total pages for display (handles both server and client pagination)
  readonly displayTotalPages = computed(() => {
    if (this.isFiltering()) {
      const orders = this.allOrders();
      const search = this.searchQuery().toLowerCase();
      const status = this.statusFilter();
      const start = this.startDate();
      const end = this.endDate();

      const filtered = orders.filter(order => {
        if (search) {
          const orderId = (order.orderId || order.id || '').toLowerCase();
          const packageName = (order.packageName || '').toLowerCase();
          const testName = (order.testName || '').toLowerCase();
          if (!orderId.includes(search) && !packageName.includes(search) && !testName.includes(search)) {
            return false;
          }
        }

        if (status !== 'All') {
          const orderStatus = this.normalizeStatus(order.orderStatus);
          if (orderStatus !== status) {
            return false;
          }
        }

        if (start || end) {
          const orderDate = new Date(order.orderDate);
          if (start && orderDate < start) return false;
          if (end && orderDate > end) return false;
        }

        return true;
      });

      return Math.ceil(filtered.length / this._pageSize()) || 1;
    }
    return this._totalPages();
  });

  readonly rows = signal<ReadonlyArray<OrderRow>>([]);

  readonly showingLabel = signal<string>('Showing 0 to 0 of 0 orders');

  readonly paginationButtons = signal<Array<number | string>>([]);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    // Always load all orders for client-side filtering and pagination
    this.ordersApi.getMyOrders(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.allOrders.set(response.content);
          this.totalCount.set(response.totalElements);
          this._totalPages.set(response.totalPages);
          this.processOrders();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load orders:', err);
          this.error.set('Unable to load your order history. Please try again later.');
          this.loading.set(false);
        }
      });
  }

  private processOrders(): void {
    const orders = this.allOrders();
    const search = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    const start = this.startDate();
    const end = this.endDate();

    // Check if any filter is active
    const hasActiveFilter = !!(search || status !== 'All' || start || end);
    this.isFiltering.set(hasActiveFilter);

    const filtered = orders.filter(order => {
      // Search filter
      if (search) {
        const orderId = (order.orderId || order.id || '').toLowerCase();
        const packageName = (order.packageName || '').toLowerCase();
        const testName = (order.testName || '').toLowerCase();
        if (!orderId.includes(search) && !packageName.includes(search) && !testName.includes(search)) {
          return false;
        }
      }

      // Status filter
      if (status !== 'All') {
        const orderStatus = this.normalizeStatus(order.orderStatus);
        if (orderStatus !== status) {
          return false;
        }
      }

      // Date range filter
      if (start || end) {
        const orderDate = new Date(order.orderDate);
        if (start && orderDate < start) return false;
        if (end && orderDate > end) return false;
      }

      return true;
    });

    // Always use client-side pagination
    const filteredTotal = filtered.length;
    const page = this._currentPage();
    const size = this._pageSize();
    const filteredTotalPages = Math.ceil(filteredTotal / size) || 1;
    
    // Apply client-side pagination
    const startIdx = page * size;
    const endIdx = startIdx + size;
    const paginatedFiltered = filtered.slice(startIdx, endIdx);
    const mapped = paginatedFiltered.map(order => this.mapOrderToRow(order));
    this.rows.set(mapped);

    const startCount = mapped.length > 0 ? startIdx + 1 : 0;
    const endCount = startIdx + mapped.length;
    const labelSuffix = hasActiveFilter ? ' (filtered)' : '';
    this.showingLabel.set(`Showing ${startCount} to ${endCount} of ${filteredTotal} orders${labelSuffix}`);

    // Update pagination buttons
    const current = this._currentPage();
    const buttons: Array<number | string> = [];

    if (filteredTotalPages <= 7) {
      for (let i = 0; i < filteredTotalPages; i++) {
        buttons.push(i);
      }
    } else {
      buttons.push(0);
      if (current > 2) buttons.push('...');
      for (let i = Math.max(1, current - 1); i <= Math.min(filteredTotalPages - 2, current + 1); i++) {
        buttons.push(i);
      }
      if (current < filteredTotalPages - 3) buttons.push('...');
      buttons.push(filteredTotalPages - 1);
    }

    this.paginationButtons.set(buttons);
  }

  retryLoadOrders(): void {
    this.loadOrders();
  }

  goToPage(page: number | string): void {
    // Ignore string values (ellipsis)
    if (typeof page === 'string') return;
    
    // Calculate total pages based on current filtered data
    const filteredTotal = this.allOrders().filter(order => {
      const search = this.searchQuery().toLowerCase();
      const status = this.statusFilter();
      const start = this.startDate();
      const end = this.endDate();

      if (search) {
        const orderId = (order.orderId || order.id || '').toLowerCase();
        const packageName = (order.packageName || '').toLowerCase();
        const testName = (order.testName || '').toLowerCase();
        if (!orderId.includes(search) && !packageName.includes(search) && !testName.includes(search)) {
          return false;
        }
      }

      if (status !== 'All') {
        const orderStatus = this.normalizeStatus(order.orderStatus);
        if (orderStatus !== status) {
          return false;
        }
      }

      if (start || end) {
        const orderDate = new Date(order.orderDate);
        if (start && orderDate < start) return false;
        if (end && orderDate > end) return false;
      }

      return true;
    }).length;

    const size = this._pageSize();
    const filteredTotalPages = Math.ceil(filteredTotal / size) || 1;

    if (page < 0 || page >= filteredTotalPages) return;
    this._currentPage.set(page);
    this.processOrders();
  }

  nextPage(): void {
    this.goToPage(this._currentPage() + 1);
  }

  previousPage(): void {
    this.goToPage(this._currentPage() - 1);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this._currentPage.set(0);
    this.processOrders();
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
    this._currentPage.set(0);
    this.processOrders();
  }

  onStartDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.startDate.set(input.value ? new Date(input.value) : null);
    this._currentPage.set(0);
    this.processOrders();
  }

  onEndDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.endDate.set(input.value ? new Date(input.value) : null);
    this._currentPage.set(0);
    this.processOrders();
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this._pageSize.set(Number(select.value));
    this._currentPage.set(0);
    this.processOrders();
  }

  private mapOrderToRow(order: OrderItem): OrderRow {
    const date = new Date(order.orderDate);
    const dateText = this.formatDate(date);
    const timeText = this.formatTime(date);

    return {
      id: order.orderId || order.id || '',
      title: order.packageName || order.testName || 'Unknown',
      subtitle: order.packageName ? 'Package' : 'Test',
      dateText,
      timeText,
      amount: order.totalAmount,
      status: this.normalizeStatus(order.orderStatus)
    };
  }

  private formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const minutesStr = minutes.toString().padStart(2, '0');
    return `${hours12}:${minutesStr} ${ampm}`;
  }

  private normalizeStatus(status: string): OrderStatus {
    const normalized = status?.toLowerCase() || '';
    if (normalized.includes('complete')) return 'Completed';
    if (normalized.includes('cancel')) return 'Cancelled';
    if (normalized.includes('process')) return 'Processing';
    if (normalized.includes('sample')) return 'Sample Collected';
    if (normalized.includes('confirm')) return 'Confirmed';
    return 'Pending';
  }

  statusClass(status: OrderStatus): string {
    if (status === 'Completed') return 'pill pill--ok';
    if (status === 'Cancelled') return 'pill pill--bad';
    if (status === 'Processing') return 'pill pill--info';
    if (status === 'Confirmed') return 'pill pill--info';
    return 'pill pill--muted';
  }
}
