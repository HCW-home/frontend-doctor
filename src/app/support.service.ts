
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SupportService {

  constructor(
    private http: HttpClient
  ) { }

  sendSupportRequest(req): Observable<any> {


    return  this.http.post<any[]>(environment.api + '/support', req);
  }

}
