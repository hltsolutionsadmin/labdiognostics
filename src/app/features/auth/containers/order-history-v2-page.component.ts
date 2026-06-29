import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthSignalService } from '../data-access/auth-signal.service';

type OrderStatus = 'Completed' | 'Cancelled' | 'Processing' | 'Sample Collected';
type PaymentMode = 'UPI' | 'Card' | 'COD';

type OrderRow = {
  id: string;
  dateText: string;
  timeText: string;
  amount: number;
  mrp?: number;
  status: OrderStatus;
  paymentMode: PaymentMode;
  paymentState: string;
  actionLabel: string;
};

@Component({
  selector: 'app-order-history-v2-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CurrencyPipe],
  templateUrl: './order-history-v2-page.component.html',
  styleUrl: './order-history-v2-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderHistoryV2PageComponent {
  private readonly auth = inject(AuthSignalService);
  readonly user = this.auth.user;

  readonly rows: ReadonlyArray<OrderRow> = [
    {
      id: 'CLD1250529001',
      dateText: '29 May 2025',
      timeText: '09:15 AM',
      amount: 1499,
      mrp: 2500,
      status: 'Completed',
      paymentMode: 'UPI',
      paymentState: 'Paid',
      actionLabel: 'View Report'
    },
    {
      id: 'CLD1250510203',
      dateText: '20 May 2025',
      timeText: '08:30 AM',
      amount: 499,
      mrp: 800,
      status: 'Completed',
      paymentMode: 'Card',
      paymentState: 'Paid',
      actionLabel: 'View Report'
    },
    {
      id: 'CLD1250415508',
      dateText: '15 Apr 2025',
      timeText: '10:00 AM',
      amount: 999,
      mrp: 1500,
      status: 'Completed',
      paymentMode: 'UPI',
      paymentState: 'Paid',
      actionLabel: 'View Report'
    },
    {
      id: 'CLD1250311222',
      dateText: '31 Mar 2025',
      timeText: '09:00 AM',
      amount: 699,
      mrp: 1200,
      status: 'Cancelled',
      paymentMode: 'Card',
      paymentState: 'Refunded',
      actionLabel: 'View Details'
    },
    {
      id: 'CLD1250208876',
      dateText: '08 Feb 2025',
      timeText: '11:30 AM',
      amount: 599,
      mrp: 1000,
      status: 'Completed',
      paymentMode: 'UPI',
      paymentState: 'Paid',
      actionLabel: 'View Report'
    },
    {
      id: 'CLD1250117789',
      dateText: '10 Jan 2025',
      timeText: '04:20 PM',
      amount: 1299,
      mrp: 2200,
      status: 'Processing',
      paymentMode: 'UPI',
      paymentState: 'Paid',
      actionLabel: 'View Details'
    },
    {
      id: 'CLD1241213345',
      dateText: '12 Dec 2024',
      timeText: '09:45 AM',
      amount: 399,
      mrp: 700,
      status: 'Sample Collected',
      paymentMode: 'Card',
      paymentState: 'Paid',
      actionLabel: 'View Details'
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
