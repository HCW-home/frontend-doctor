import { SocketEventsService } from "../core/socket-events.service";

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../environments/environment";

import { Router } from "@angular/router";
import { User } from "../user";
import { ConfigService } from "../core/config.service";

@Injectable({ providedIn: "root" })
export class AuthService {
  public currentUserSubject: BehaviorSubject<any>;
  private loggedIn: Subject<User> = new Subject();
  public currentUser: Observable<User>;

  constructor(private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private socketEventsService: SocketEventsService) {
    this.currentUserSubject = new BehaviorSubject<User>(null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  public loggedInSub() {
    return this.loggedIn;
  }
  login(token) {
    const headers = {};
    if (token) {
      headers["x-access-token"] = token;
    }
    return this.http.get<any>(`${environment.api}/current-user?_version=${environment.version}`, { headers })
      .pipe(map(res => {
        if (res.user && res.user.token) {
          this.currentUserSubject.next(res.user);
          return res.user;
        }
      }));
  }
  storeCurrentUser(user) {
    this.currentUserSubject.next(user);
  }

  verifyRefreshToken() {
    const currentUser = this.currentUserValue;
    const refreshToken = currentUser?.refreshToken;
    return this.http.post<any>(`${environment.api}/verify-refresh-token`,{ refreshToken });
  }


  refreshTokens() {
    const currentUser = this.currentUserValue;
    const refreshToken = currentUser.refreshToken;
    return this.http.post<any>(`${environment.api}/refresh-token`,{ refreshToken });
  }

  loginLocal(email, password) {

    const opts =  { withCredentials: true };


    return this.http.post<any>(`${environment.api}/login-local`, { email, password, _version: environment.version }, opts).pipe(map(res => {
      if (res.user && res.user.token) {
        this.currentUserSubject.next(res.user);
      }
      return res;
    }));
  }

  getResetPasswordLink(email) {
    return this.http.post<any>(`${environment.api}/forgot-password`, { email, }, {});
  }

  resetPassword(token, password) {
    return this.http.post<any>(`${environment.api}/reset-password`, { password, token }, {});
  }

  loginSms(smsVerificationCode: string, user: string) {
    return this.http.post<any>(`${environment.api}/login-sms`, { smsVerificationCode, user });
  }

  login2FA(localLoginToken, smsLoginToken, user) {
    const opts =  { withCredentials: true };


    return this.http.post<any>(`${environment.api}/login-2fa`, { localLoginToken, smsLoginToken, user }, opts)
      .pipe(map(res => {
        if (res.user && res.user.token) {
          // sessionStorage.setItem('currentUser', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          return res.user;
        }
      }));
  }

  logout(hard = false) {
    // sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.socketEventsService.disconnect()
    this.http.get(`${environment.api}/logout`).subscribe(r => {
      if (hard) {
        if (this.configService.config.method === "openid") {
          window.location.href = this.configService.config.openIdLogoutUri;
        } else {
          this.router.navigate(["/login"]);
        }
      } else {
        this.router.navigate(["/login"]);
      }
    }, err => {
      this.router.navigate(["/login"]);
    })
  }

  switchUser() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.socketEventsService.disconnect();
    this.http.get(`${environment.api}/logout`).subscribe(
      () => this.router.navigate(['/login']),
      () => this.router.navigate(['/login'])
    );
  }

  getToken() {
    return this.currentUserSubject.value.token;
  }

  getLang() {
    return window.localStorage.getItem("hhw-lang") || window.navigator.language.slice(0, 2);
  }

  getCurrentUser(token?) {
    const opts =  { withCredentials: true };


    return this.http.get<any>(`${environment.api}/current-user`, opts).pipe(map(res => {

      this.currentUserSubject.next(res.user);

      return res.user
    }))
  }
}
