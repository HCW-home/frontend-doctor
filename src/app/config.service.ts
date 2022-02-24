import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  public configSub : Subject<any> = new Subject()
  public config
  constructor(private http: HttpClient) {

   }

   getConfig() {
    return this.http.get<any>(`${environment.api}/config`).toPromise().then(config=>{
      console.log('got config', config)
      this.config = config
      this.configSub.next(config)
    });
  }




}
