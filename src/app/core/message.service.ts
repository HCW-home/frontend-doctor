import { Injectable } from '@angular/core';

import { Observable, } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private http: HttpClient) { }


  getConsultationMessages(id, skip, noPagination): Observable<any> {
    const msgsURL = (noPagination) ? environment.api + `/message?where={"consultation":"${id}"}&sort=createdAt DESC&limit=2000` :
      environment.api + `/message?where={"consultation":"${id}"}&sort=createdAt DESC&limit=20&skip=${skip}`;
    return this.http.get<any>(msgsURL)
      .pipe(map((msgs) => {
        return msgs.reverse();
      }));
  }

  sendMessage(consultationId, text): Observable<any> {
    return this.http.post<any[]>(environment.api + `/message`, {
      text,
      consultation: consultationId,
      type: 'text'
    });
  }

  /// &sort=createdAt%20DES&skip=${skip}
}
