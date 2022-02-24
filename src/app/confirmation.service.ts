import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {

  constructor() { }

  private confirmationObs$ = new Subject();

  getConfirmation(): any {
      return this.confirmationObs$;
  }

  requestConfirmation(redirectUrl) {
      this.confirmationObs$.next(redirectUrl);
  }

}
