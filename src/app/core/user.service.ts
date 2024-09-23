import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {User} from "../user";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private http: HttpClient
  ) { }

  getUserIp(): Observable<any> {
    return this.http.get<any[]>(environment.api + "/user/ip");
  }

  getUser(id): Observable<any> {
    return this.http.get<any>(`${environment.api}/user/${id}`);
  }
  updatePhoneNumberNotif(phoneNumber): Observable<any> {
    return this.http.post<any>(`${environment.api}/user/notif`, { notifPhoneNumber: phoneNumber });
  }
  updateEnableNotif(enableNotif): Observable<any> {
    return this.http.post<any>(`${environment.api}/user/notif`, { enableNotif });
  }

  updateUserProfile(id, firstName: string, lastName: string, department: string, phoneNumber: string): Observable<any> {
    return this.http.patch<any>(`${environment.api}/user/${id}`, { firstName, lastName, department, phoneNumber });
  }

  updateUserTerms(body) {
    return this.http.post<User>(`${environment.api}/user/terms`, body);
  }

}
