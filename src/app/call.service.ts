import { environment } from './../environments/environment';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CallService {
  private callObs$ = new Subject();

  public isFullScreen: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(private http: HttpClient) {

  }
  getCall(): any {
    return this.callObs$;
  }

  requestCall(data: boolean) {
    this.callObs$.next(data);
  }

  getCurrentCall(consultationId) {
    return this.http.get<any>(environment.api + '/consultation/' + consultationId + '/current-call')
  }
}
