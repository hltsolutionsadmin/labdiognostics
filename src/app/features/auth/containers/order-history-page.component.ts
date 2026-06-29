import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthSignalService } from '../data-access/auth-signal.service';

type OrderStatus = 'Completed' | 'Cancelled' | 'Processing' | 'Sample Collected';

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
export class OrderHistoryPageComponent {
  private readonly auth = inject(AuthSignalService);
  readonly user = this.auth.user;

  readonly rows: ReadonlyArray<OrderRow> = [
    {
      id: 'CLD1250529001',
      title: 'Full Body Checkup',
      subtitle: '80+ Tests',
      dateText: '29 May 2025',
      timeText: '09:15 AM',
      amount: 1499,
      mrp: 2500,
      status: 'Completed'
    },
    {
      id: 'CLD1250510203',
      title: 'Thyroid Profile',
      subtitle: '13 Tests',
      dateText: '20 May 2025',
      timeText: '08:30 AM',
      amount: 499,
      mrp: 800,
      status: 'Completed'
    },
    {
      id: 'CLD1250415508',
      title: 'Vitamin D',
      subtitle: '1 Test',
      dateText: '15 Apr 2025',
      timeText: '10:00 AM',
      amount: 999,
      mrp: 1500,
      status: 'Completed'
    },
    {
      id: 'CLD1250311222',
      title: 'Diabetes Profile',
      subtitle: '28 Tests',
      dateText: '31 Mar 2025',
      timeText: '09:00 AM',
      amount: 699,
      mrp: 1200,
      status: 'Cancelled'
    },
    {
      id: 'CLD1250208876',
      title: 'Liver Function Test',
      subtitle: '22 Tests',
      dateText: '08 Feb 2025',
      timeText: '11:30 AM',
      amount: 599,
      mrp: 1000,
      status: 'Completed'
    },
    {
      id: 'CLD1250117789',
      title: 'Heart Health Package',
      subtitle: '30 Tests',
      dateText: '10 Jan 2025',
      timeText: '04:20 PM',
      amount: 1299,
      mrp: 2200,
      status: 'Processing'
    },
    {
      id: 'CLD1241213345',
      title: 'Kidney Function Test',
      subtitle: '7 Tests',
      dateText: '12 Dec 2024',
      timeText: '09:45 AM',
      amount: 399,
      mrp: 700,
      status: 'Sample Collected'
    }
  ];

  readonly totalCount = 42;

  readonly showingLabel = computed(() => {
    const start = this.rows.length > 0 ? 1 : 0;
    const end = this.rows.length;
    return `Showing ${start} to ${end} of ${this.totalCount} orders`;
  });

  statusClass(status: OrderStatus): string {
    if (status === 'Completed') return 'pill pill--ok';
    if (status === 'Cancelled') return 'pill pill--bad';
    if (status === 'Processing') return 'pill pill--info';
    return 'pill pill--muted';
  }
}
