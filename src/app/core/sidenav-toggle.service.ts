import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidenavToggleService {
  private sidenavStateSource = new Subject<string>();
  sidenavState$ = this.sidenavStateSource.asObservable();

  toggleSidenav(action?: 'open' | 'close'): void {
    if (action) {
      this.sidenavStateSource.next(action);
    } else {
      this.sidenavStateSource.next('toggle');
    }
  }
}
