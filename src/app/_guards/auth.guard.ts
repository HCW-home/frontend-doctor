import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })

export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const currentUser = this.authService.currentUserValue;

    if (currentUser) {
      return true;
    }


    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url, ...state.root.queryParams } });
    return false;
  }
}
