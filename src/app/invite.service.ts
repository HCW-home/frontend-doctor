import { Invitation } from './Invitation';
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InviteService {

  constructor(private http: HttpClient) {

  }
  createInvitation(invite): Observable<any> {
    return this.http.post<any[]>(environment.api + `/invite`, invite);

  }

  getInvitations(page, limit): Observable<HttpResponse<Invitation[]>> {
    return this.http.get<Invitation[]>(environment.api + `/PublicInvite?limit=${limit}&skip=${page}&populate=translatorRequestInvite,guestInvite&sort="createdAt DESC"`, { observe: 'response', responseType: 'json' });
  }



  resendInvite(id) {
    return this.http.post<any[]>(environment.api + `/invite/${id}/resend`, null);

  }


  revokeInvite(id) {
    return this.http.post<any[]>(environment.api + `/invite/${id}/revoke`, null);

  }

  getByConsultation(consultationId): Observable<any> {
    return this.http.get((environment.api + `/consultation/${consultationId}/invite/`) as any);
  }

  updateInvite(invite, id): Observable<any> {
    return this.http.patch(environment.api + `/invite/${id}`, invite);
  }
}
