import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentNotificationService {
  private paymentDataUpdated = new Subject<void>();

  // Observable that components can subscribe to
  public paymentDataUpdated$ = this.paymentDataUpdated.asObservable();

  constructor() { }

  // Method to notify that payment data has been updated
  notifyPaymentDataUpdated(): void {
    console.log('Notifying subscribers that payment data has been updated');
    this.paymentDataUpdated.next();
  }
}
