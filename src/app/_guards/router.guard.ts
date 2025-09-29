import { Injectable } from '@angular/core';
import {
  Router,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { ConfirmationService } from '../core/confirmation.service';
import { ConsultationService } from '../core/consultation.service';

import { Observable, of } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class RouterGuard {
  consultationPath = /\/consultation\/.{24}(\/|$|\?)/;
  constructor(
    private router: Router,
    private confirmationServ: ConfirmationService,
    private consultationService: ConsultationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const currentNav = this.router.getCurrentNavigation();
    if (
      currentNav &&
      currentNav.extras.state &&
      currentNav.extras.state.confirmed
    ) {
      return of(true);
    }
    if (this.consultationPath.test(this.router.url)) {
      const currentUrlMatch = this.router.url.match(
        /\/consultation\/([a-f0-9]{24})/
      );
      if (currentUrlMatch) {
        const currentConsultationId = currentUrlMatch[1];
        const currentConsultation =
          this.consultationService.consultationsOverview.find(
            c => c._id === currentConsultationId
          );
        if (
          currentConsultation &&
          currentConsultation.consultation.status === 'closed'
        ) {
          return of(true);
        }
      }

      const redirect = this.consultationPath.test(state.url)
        ? '/dashboard'
        : state.url;
      this.confirmationServ.requestConfirmation(redirect);
      return of(false);
    }

    return of(true);
  }
}
