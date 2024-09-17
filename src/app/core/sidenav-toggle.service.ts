import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidenavToggleService {
  private toggleSidenavSource = new Subject<void>();

  toggleSidenav$ = this.toggleSidenavSource.asObservable();

  toggleSidenav() {
    this.toggleSidenavSource.next();
  }
}
