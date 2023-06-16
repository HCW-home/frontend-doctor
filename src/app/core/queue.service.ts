import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QueueService {

  constructor(private http: HttpClient) {

  }
  getQueues(): Observable<any> {
    return this.http.get<any[]>(environment.api + `/queue?limit=2000`);

  }

}
