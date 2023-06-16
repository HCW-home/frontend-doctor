import { Injectable } from "@angular/core";
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { AuthService } from "./auth.service";
import { SocketEventsService } from "../core/socket-events.service";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService,
    private _socketEventsService: SocketEventsService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      console.log("error ", err);

      if (err.statusText === "Unknown Error") {
        this._socketEventsService.updateConnectionStatus("connect_failed");
      }

      if (err.status === 401 || err.status === 403) {
        // auto logout if 401 response returned from api
        this.authService.logout();
      }

      const error = err.error.message || err.statusText;
      return throwError(error);
    }));
  }
}
