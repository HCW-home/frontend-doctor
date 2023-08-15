import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {AuthService} from "./auth.service";

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const headersConfig = {};

        const currentUser = this.authService.currentUserValue;
        if (currentUser && currentUser.token) {
            headersConfig["x-access-token"] = `${currentUser.token}`;
        }

        headersConfig["locale"] = localStorage.getItem("hhw-lang") || "en";

        request = request.clone({
            withCredentials: true,
            setHeaders: headersConfig
        });

        return next.handle(request);
    }
}
