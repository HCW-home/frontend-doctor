import { Injectable } from "@angular/core";
import {
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpInterceptor,
} from "@angular/common/http";
import { catchError } from "rxjs/operators";
import { Observable, throwError } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";

import { AuthService } from "./auth.service";
import { SocketEventsService } from "../core/socket-events.service";
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private translate: TranslateService,
    private _socketEventsService: SocketEventsService,
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err: any) => {
        console.log("Error encountered:", err);

        if (err.statusText === "Unknown Error") {
          this._socketEventsService.updateConnectionStatus("connect_failed");
        }

        const refreshTokenEndpoint = 'refresh-token';
        if (err.status === 401 && request.url.includes(refreshTokenEndpoint)) {
          this.authService.logout();
        }

        const excludedExtensions = ['.json', '.md', '.txt', '.svg', 'verify-refresh-token'];
        const shouldSkipPopup = excludedExtensions.some(ext => request.url.endsWith(ext));

        if (shouldSkipPopup) {
          return throwError(() => err);
        }

        let titleKey = 'error.defaultTitle';
        let messageKey = 'error.defaultMessage';

        if (err) {
          if (err.error?.error && err.error?.text?.includes('<html>')) {
            titleKey = 'error.blockedTitle';
            messageKey = 'error.blockedMessage';
            const title = this.translate.instant(titleKey);
            const message = this.translate.instant(messageKey);

            this.dialog.open(ErrorDialogComponent, {
              data: {
                title,
                message
              }
            });
          }
        }

        return throwError(() => err);
      })
    );
  }
}
